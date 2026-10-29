import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Observable, of } from "rxjs";
import { catchError, defaultIfEmpty, map, switchMap, take, timeout } from "rxjs/operators";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { ContextoConsulta, LECTURA_ESTRICTA } from "../../../../generics/generic-crud.constantes";
import { SorteosAplicablesGQL } from "../../../operaciones/sorteo/graphql/sorteo.gql";
import { SorteoAplicable, SorteoClienteInput } from "../../../operaciones/sorteo/sorteo.model";
import { Cobro } from "../../../operaciones/venta/cobro/cobro.model";
import { Venta } from "../../../operaciones/venta/venta.model";
import { VentaService } from "../../../operaciones/venta/venta.service";
import { Cliente } from "../../../personas/clientes/cliente.model";
import {
  SorteoClienteDialogComponent,
  SorteoClienteDialogData,
} from "./sorteo-cliente-dialog/sorteo-cliente-dialog.component";

/**
 * Corte de la consulta previa: es contra la filial local y el cajero está esperando. Si no contesta en 3 s
 * la venta sigue como siempre, sin sorteo.
 */
const TIMEOUT_SORTEOS_MS = 3000;

/** Sin «Buscando…», sin aviso de corte ni de error: si la consulta falla, la venta sigue como siempre. */
const CONTEXTO_SORTEOS: ContextoConsulta = {
  timeoutMs: TIMEOUT_SORTEOS_MS,
  silenciarAvisoTimeout: true,
  sinAviso: true,
};

/**
 * Sorteos para clientes en el POS: antes de guardar una venta averigua si participa de algún sorteo y, si
 * participa, quién es el cliente. Nada de esto puede frenar la venta: cualquier error es «no participa».
 */
@Injectable({
  providedIn: "root",
})
export class SorteoPosService {
  constructor(
    private genericService: GenericCrudService,
    private sorteosAplicables: SorteosAplicablesGQL,
    private ventaService: VentaService,
    private dialog: MatDialog
  ) {}

  /**
   * Quién participa del sorteo con esta venta, o null si no participa (no califica, delivery, la filial
   * no conoce los sorteos o falló la consulta). «Imprimir normal» devuelve un participante sin datos.
   * Nunca falla y siempre emite una sola vez.
   *
   * `alDialogo` avisa cuando se abre (true) y se cierra (false) el diálogo, para que el PDV no tome
   * atajos de teclado mientras tanto.
   */
  resolverParticipante(
    venta: Venta,
    cobro: Cobro,
    ventaCreditoInput?: { clienteId?: number },
    alDialogo?: (abierto: boolean) => void
  ): Observable<SorteoClienteInput | null> {
    try {
      if (venta == null || venta.isDelivery === true || venta.delivery != null) return of(null);
      if (venta.totalGs == null) return of(null);
      // La filial aplica la fórmula: se le manda lo mismo que va a recibir saveVenta.
      const input = {
        totalGs: venta.totalGs,
        cobroDetalleList: this.ventaService.cobroDetalleInputs(cobro),
      };
      return this.genericService
        .onCustomQuery(this.sorteosAplicables, { input }, false, LECTURA_ESTRICTA, true, CONTEXTO_SORTEOS)
        .pipe(
          // Red de seguridad por si el link no corta: el cajero no puede quedar esperando.
          timeout(TIMEOUT_SORTEOS_MS + 1000),
          take(1),
          catchError((err) => {
            // Una filial sin sorteos responde con error de validación: es el caso normal, sin aviso.
            console.warn("Sorteos: no se pudo consultar sorteosAplicables; la venta sigue sin sorteo", err);
            return of(null);
          }),
          switchMap((aplicables: SorteoAplicable[]) => {
            const sorteos = (aplicables ?? []).filter((s) => s != null && s.cantidadTickets > 0);
            if (sorteos.length === 0) return of(null);
            const delCliente = this.participanteDeVenta(venta, ventaCreditoInput);
            if (delCliente != null) return of(delCliente);
            return this.pedirAlCajero(sorteos, venta.cliente, alDialogo);
          }),
          catchError((err) => {
            console.error("Sorteos: error al resolver el participante; la venta sigue sin sorteo", err);
            return of(null);
          }),
          defaultIfEmpty(null)
        );
    } catch (err) {
      console.error("Sorteos: error al preparar la consulta; la venta sigue sin sorteo", err);
      return of(null);
    }
  }

  /**
   * El cliente que la venta ya trae (factura legal o crédito), o null si no tiene. El cliente 0 es el
   * genérico: no cuenta. Si no se conoce el nombre se manda vacío y la filial lo toma del cliente.
   */
  participanteDeVenta(venta: Venta, ventaCreditoInput?: { clienteId?: number }): SorteoClienteInput | null {
    const cliente: Cliente = venta?.cliente;
    const clienteId = cliente?.id != null && cliente.id != 0 ? cliente.id : ventaCreditoInput?.clienteId;
    if (clienteId == null || clienteId == 0) return null;
    const mismoCliente = cliente?.id == clienteId;
    const nombre = mismoCliente ? (cliente?.persona?.nombre ?? cliente?.nombre ?? "").trim() : "";
    const documento = mismoCliente ? (cliente?.persona?.documento ?? cliente?.documento ?? "").trim() : "";
    return { clienteId, documento: documento !== "" ? documento : null, nombre };
  }

  private pedirAlCajero(
    sorteos: SorteoAplicable[],
    cliente: Cliente,
    alDialogo?: (abierto: boolean) => void
  ): Observable<SorteoClienteInput | null> {
    const data: SorteoClienteDialogData = {
      sorteos,
      documento: cliente?.persona?.documento ?? cliente?.documento ?? null,
    };
    alDialogo?.(true);
    return this.dialog
      .open(SorteoClienteDialogComponent, {
        data,
        // Solo los dos botones cierran: ni Esc ni un click afuera (el cajero tiene que decidir).
        disableClose: true,
        autoFocus: true,
        restoreFocus: false,
        width: "520px",
      })
      .afterClosed()
      .pipe(
        // Cualquier respuesta del diálogo participa. «Imprimir normal» llega con el nombre vacío: el
        // ticket sale con líneas en blanco para completar a mano (nombre es obligatorio en el schema).
        map((res: SorteoClienteInput) => (res != null ? { ...res, nombre: (res.nombre ?? "").trim() } : null)),
        map((res) => {
          alDialogo?.(false);
          return res;
        }),
        catchError((err) => {
          alDialogo?.(false);
          throw err;
        })
      );
  }
}
