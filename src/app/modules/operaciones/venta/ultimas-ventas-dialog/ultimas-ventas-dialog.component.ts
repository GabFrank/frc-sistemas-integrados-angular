import { Component, Inject, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { PdvCaja } from "../../../financiero/pdv/caja/caja.model";
import { Venta } from "../venta.model";
import { ErrorCancelacionVenta, VentaService } from "../venta.service";
import { PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_MOSTRADOR_MS } from "../../../../generics/generic-crud.constantes";

/** Diálogo del POS contra la sucursal: el cajero espera de pie (#390). */
const CONSULTA_MOSTRADOR = { timeoutMs: TIMEOUT_CONSULTA_MOSTRADOR_MS, silenciarAvisoTimeout: true };
import { VentaTarjetaService } from "../../../financiero/venta-tarjeta/venta-tarjeta.service";
import { erroresDeRechazo, motivoDelRechazo } from "../../../../commons/core/utils/graphqlErrorUtils";
import { esTimeoutDeLink } from "../../../../shared/services/timeout-link";

class UltimasVentasDialogData {
  caja: PdvCaja;
  cancelacion?: boolean;
  reimpresion: boolean;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from "../../../../shared/components/paginacion/paginacion-lista";
import { catchError, of } from "rxjs";
import { VentaEstado } from "../enums/venta-estado.enums";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-ultimas-ventas-dialog",
  templateUrl: "./ultimas-ventas-dialog.component.html",
  styleUrls: ["./ultimas-ventas-dialog.component.scss"],
})
export class UltimasVentasDialogComponent implements OnInit {
  dataSource = new MatTableDataSource<Venta>([]);
  selectedVenta: Venta;
  codigoVentaControl = new FormControl();
  titulo = "";

  /** Ventas de la caja paginadas en la sucursal (#772): gana la última página pedida; si falla una página vuelve a la anterior. */
  pag: PaginacionLista<Venta> = new PaginacionLista<Venta>({
    cargar: (page, size) => this.ventaService
      .onSearch(null, this.data.caja.id, page, size, false, this.data.caja.sucursalId, null, null, null, null, false, false, false,
        PROPAGAR_ERROR_DE_RED, undefined, CONSULTA_MOSTRADOR)
      .pipe(catchError(() => {
        this.notificacionSnackBar.openWarn('No se pudieron cargar las últimas ventas: la sucursal no responde. Intentá de nuevo.', 5);
        return of(null); // null sin aviso: error GraphQL, el servicio ya avisó
      })),
    pageSize: 10,
    pageSizeOptions: [5, 10, 15, 25, 50],
    alCargar: (res) => {
      this.dataSource.data = res.getContent ?? [];
      this.marcarSorteos(this.dataSource.data);
    },
    // Sin el listado de otra búsqueda a la vista (y cancelable) como si fuera el pedido (#390).
    alFallar: (filtroNuevo) => filtroNuevo && (this.dataSource.data = []),
  });

  displayedColumns = [
    "id",
    "modo",
    "precioDelivery",
    "totalGs",
    "totalRs",
    "totalDs",
    "estado",
    "cliente",
    "acciones",
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UltimasVentasDialogData,
    private matDialogRef: MatDialogRef<UltimasVentasDialogComponent>,
    private ventaService: VentaService,
    private cargandoService: CargandoDialogService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private dialogService: DialogosService,
    private ventaTarjetaService: VentaTarjetaService
  ) {
    if (data?.cancelacion == true) {
      this.titulo = "CANCELAR VENTA";
    } else if (data?.reimpresion == true) {
      this.titulo = "REIMPRESIÓN DE TICKET";
    }
  }

  ngOnInit(): void {
    this.pag.filtrar();
  }

  /** Sin el listado de otra página o búsqueda a la vista (y cancelable) como si fuera el pedido (#390). */
  private vaciarSinRespuesta(aviso: string | null): void {
    this.pag.limpiar();
    this.dataSource.data = [];
    if (aviso) this.notificacionSnackBar.openWarn(aviso, 5);
  }

  onBuscarPorCodigo() {
    if (this.codigoVentaControl.value != null) {
      this.ventaService
        .onGetPorId(this.codigoVentaControl.value, null, null, false, PROPAGAR_ERROR_DE_RED, CONSULTA_MOSTRADOR).pipe(untilDestroyed(this))
        .subscribe({ error: () => this.vaciarSinRespuesta('No se pudo buscar la venta: la sucursal no responde. Intentá de nuevo.'),
        next: (res) => {
          if (res != null) {
            this.dataSource.data = [res];
            this.marcarSorteos([res]);
          } else {
            this.notificacionSnackBar.notification$.next({
              texto:
                "Venta con código " +
                this.codigoVentaControl.value +
                " no encontrada.",
              color: NotificacionColor.warn,
              duracion: 3,
            });
          }
        } });
    }
  }

  /**
   * Cancela la venta en el CENTRAL, que es donde se recorre toda la cadena: caja, stock, delivery,
   * credito, factura y venta con tarjeta. La replica la baja a esta sucursal.
   *
   * Hasta el 2026-09-28 esto iba al filial (`servidor=false`), cuyo `cancelarVenta` era un stub que
   * devolvia true sin hacer nada: el cajero veia "Cancelado con exito" y la venta seguia igual.
   *
   * El central ALTERNA (una venta cancelada se reactiva), y esta pantalla solo ofrece cancelar: por
   * eso una venta ya cancelada no se manda.
   */
  cancelarVenta(venta: Venta, index) {
    if (venta?.estado == VentaEstado.CANCELADA) {
      this.notificacionSnackBar.openWarn("La venta " + venta.id + " ya está cancelada.");
      return;
    }
    this.dialogService
      .confirm(
        "ATENCIÓN!!",
        "Realmente desea cancelar la venta " + venta.id + "?",
        "Al cancelar una venta debe escribir el motivo de cancelación en el ticket y enviar una foto de la nota"
      ).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          // La fila viene del filial, que puede ir atrasado: se relee del central y, si ya está cancelada, no se
          // manda (el central ALTERNA y la reactivaría) (#390)
          this.ventaService.onCancelarVentaVerificando(venta.id, venta.sucursalId, { soloCancelar: true }).pipe(untilDestroyed(this)).subscribe({
            next: (resultado) => {
              if (resultado.tipo === "cambio") {
                venta.estado = VentaEstado.CANCELADA;
                this.dataSource.data = updateDataSource(this.dataSource.data, venta, index);
                this.notificacionSnackBar.openWarn("La venta " + venta.id + " ya estaba cancelada en el servidor: no se envió nada.", 6);
                return;
              }
              const res = resultado.tipo === "aplicada";
              if (!res) {
                this.notificacionSnackBar.openAlgoSalioMal("No se pudo cancelar la venta " + venta.id + ".");
                return;
              }
              this.notificacionSnackBar.openSucess("Cancelado con éxito");
              venta.estado = VentaEstado.CANCELADA;
              this.dataSource.data = updateDataSource(this.dataSource.data, venta, index);
              // Respaldo: el central ya la cancela, pero si alguna vez se revierte el central por
              // debajo de este cambio, esto sigue cancelando la venta con tarjeta en la sucursal.
              // Las dos escriben CANCELADO: repetirlo no cambia nada.
              this.ventaTarjetaService.onCancelarPorVentaId(venta.id, venta.sucursalId).subscribe({
                error: (err) => {
                  console.error('[VentaTarjeta] no se pudo cancelar el registro de tarjeta:', err);
                  this.avisarCancelacionTarjetaRechazada(err);
                },
              });
              this.reimpresionVenta(venta.id);
            },
            // Antes no habia handler: si fallaba, el cajero no veia ni exito ni error.
            error: (err: ErrorCancelacionVenta) => {
              if (err?.fase === "lectura") {
                this.notificacionSnackBar.openWarn(
                  "No se pudo verificar la venta " + venta.id + " en el servidor central: no se envió nada. Intentá de nuevo.", 6);
                return;
              }
              // El central respondió que no: no se aplicó nada y el genérico ya mostró el motivo (#488)
              if (erroresDeRechazo(err?.error) != null) {
                return;
              }
              // Sin respuesta pudo haberse cancelado. Reintentar es seguro: se relee antes y no se reactiva.
              this.notificacionSnackBar.openWarn(
                "No se pudo confirmar si la venta " + venta.id + " se canceló. Revisá la conexión con el servidor central y volvé a intentar.", 8);
            },
          });
        }
      });
  }

  reimpresionVenta(id) {
    // El éxito es res != null: el filial devuelve false al reimprimir una factura aunque imprima (VentaGraphQL.reimprimirVenta)
    this.ventaService.onReimprimirVenta(id, false).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        if (res != null) {
          this.notificacionSnackBar.openSucess("Reimpreso con éxito");
        }
      },
      // En un rechazo el genérico ya mostró el motivo y el corte por tiempo lo avisó el link. Sin respuesta pudo imprimirse:
      // repetir imprime otra vez (#501)
      error: (err) => {
        if (erroresDeRechazo(err) == null && !esTimeoutDeLink(err)) {
          this.notificacionSnackBar.openWarn(
            "No se pudo confirmar si se reimprimió la venta " + id + ": revisá la impresora antes de repetir.", 8);
        }
      },
    });
  }

  /**
   * Pide aparte si cada venta tiene ticket de sorteo, para mostrar el botón de reimprimirlo. Si no responde (o la
   * filial es vieja y no conoce el campo) simplemente no se muestra: no frena la lista.
   */
  private marcarSorteos(ventas: Venta[]): void {
    for (const venta of ventas ?? []) {
      this.ventaService.onTieneSorteo(venta.id, venta.sucursalId).pipe(untilDestroyed(this)).subscribe((tiene) => {
        if (tiene) {
          venta.tieneSorteo = true;
          this.dataSource.data = [...this.dataSource.data];
        }
      });
    }
  }

  reimpresionSorteo(id) {
    this.ventaService.onReimprimirSorteo(id, false).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        // La filial devuelve false si no encuentra la impresora o falla la impresión (a diferencia de reimpresionVenta)
        if (res === false) {
          this.notificacionSnackBar.openWarn(
            "No se pudo reimprimir el ticket de sorteo de la venta " + id + ": revisá la impresora.", 8);
        } else if (res != null) {
          this.notificacionSnackBar.openSucess("Reimpreso con éxito");
        }
      },
      // En un rechazo el genérico ya mostró el motivo y el corte por tiempo lo avisó el link. Sin respuesta pudo imprimirse:
      // repetir imprime otra vez (#501)
      error: (err) => {
        if (erroresDeRechazo(err) == null && !esTimeoutDeLink(err)) {
          this.notificacionSnackBar.openWarn(
            "No se pudo confirmar si se reimprimió el ticket de sorteo de la venta " + id + ": revisá la impresora antes de repetir.", 8);
        }
      },
    });
  }

  salir() {
    this.matDialogRef.close();
  }

  /**
   * La cancelación del cobro con tarjeta en la sucursal es un respaldo: el central ya lo cancela con la venta. Un corte no
   * se avisa (en un desktop sin filial saltaría siempre); un rechazo sí, con su motivo, porque es silenciosa (#488).
   */
  private avisarCancelacionTarjetaRechazada(err: any): void {
    if (erroresDeRechazo(err) == null) {
      console.warn('[VentaTarjeta] sin respuesta de la sucursal al cancelar el cobro con tarjeta: lo cancela el central', err);
      return;
    }
    this.notificacionSnackBar.openWarn(
      `La venta se canceló, pero la sucursal rechazó cancelar su cobro con tarjeta: ${motivoDelRechazo(err) ?? 'sin detalle'}.`, 8);
  }
}
