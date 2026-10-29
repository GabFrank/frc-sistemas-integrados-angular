import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Observable, of } from "rxjs";
import { catchError, finalize, map, switchMap, timeout } from "rxjs/operators";
import {
  LECTURA_ESTRICTA,
  TIMEOUT_CONSULTA_MOSTRADOR_MS,
} from "../../../../../generics/generic-crud.constantes";
import { SorteoAplicable, SorteoClienteInput } from "../../../../operaciones/sorteo/sorteo.model";
import { textoParticipaSorteo } from "../../../../operaciones/sorteo/sorteo.util";
import { Cliente } from "../../../../personas/clientes/cliente.model";
import { ClienteService } from "../../../../personas/clientes/cliente.service";

export interface SorteoClienteDialogData {
  sorteos: SorteoAplicable[];
  /** Documento que ya trae la venta (p. ej. de la factura), para no tipearlo de nuevo. */
  documento?: string | null;
}

/** Resultado de buscar un documento: un cliente con nombre, un nombre de SET, o nada. */
interface Encontrado {
  clienteId?: number;
  nombre?: string;
}

function normalizarDocumento(valor: any): string {
  return ((valor || "") + "").trim().split("-")[0];
}

function nombreDe(cliente: Cliente): string {
  const nombre = (cliente?.persona?.nombre ?? cliente?.nombre ?? "").trim();
  return nombre.toUpperCase() === "SIN NOMBRE" ? "" : nombre;
}

/**
 * Diálogo «Sorteo» del POS: la venta califica y no tiene cliente. Busca el RUC/CI primero en la base de la
 * filial y después en SET; si no aparece, el cajero escribe el nombre. Devuelve el participante o null
 * («No participa»). Solo cierran los dos botones (disableClose): Esc no hace nada.
 *
 * Teclado: Enter en RUC/CI busca; con el cliente ya encontrado, Enter confirma. Enter en Nombre confirma.
 */
@UntilDestroy()
@Component({
  selector: "app-sorteo-cliente-dialog",
  templateUrl: "./sorteo-cliente-dialog.component.html",
  styleUrls: ["./sorteo-cliente-dialog.component.scss"],
})
export class SorteoClienteDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild("documentoInput", { static: false }) documentoInput: ElementRef;
  @ViewChild("nombreInput", { static: false }) nombreInput: ElementRef;

  lineas: string[];
  documentoControl = new FormControl<string>(null);
  nombreControl = new FormControl<string>({ value: null, disabled: true });
  buscando = false;
  mensaje: string = null;
  /** Cliente de la base encontrado con `documentoBuscado`. */
  clienteId: number = null;
  /** Documento de la última búsqueda terminada (null: no se buscó o se cambió el campo). */
  documentoBuscado: string = null;

  private timers: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SorteoClienteDialogData,
    private dialogRef: MatDialogRef<SorteoClienteDialogComponent, SorteoClienteInput | null>,
    private clienteService: ClienteService
  ) {
    this.lineas = (data?.sorteos ?? []).map(
      (s) => textoParticipaSorteo(s.nombre, s.cantidadTickets)
    );
    const documento = normalizarDocumento(data?.documento);
    if (documento !== "" && documento !== "0") this.documentoControl.setValue(documento);
    // El cliente encontrado vale solo para el documento con el que se lo buscó. Un nombre escrito a mano
    // se conserva (el cajero puede estar corrigiendo el documento).
    this.documentoControl.valueChanges.pipe(untilDestroyed(this)).subscribe((valor) => {
      if (this.documentoBuscado == null || normalizarDocumento(valor) === this.documentoBuscado) return;
      this.documentoBuscado = null;
      if (this.clienteId != null) {
        this.clienteId = null;
        this.nombreControl.setValue(null);
        this.nombreControl.disable();
      }
    });
  }

  // Foco en RUC/CI aunque algo del PDV (el buscador) lo haya tomado mientras se abría el diálogo.
  ngAfterViewInit(): void {
    this.enfocar(() => this.documentoInput, 300);
  }

  ngOnDestroy(): void {
    this.timers.forEach((t) => clearTimeout(t));
  }

  onEnterDocumento(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const resuelto =
      this.documentoBuscado != null &&
      normalizarDocumento(this.documentoControl.value) === this.documentoBuscado &&
      (this.nombreControl.value ?? "").trim() !== "";
    if (resuelto) this.onConfirmar();
    else this.onBuscar();
  }

  onEnterNombre(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.onConfirmar();
  }

  onBuscar() {
    if (this.buscando) return;
    const documento = normalizarDocumento(this.documentoControl.value);
    this.mensaje = null;
    if (documento === "") {
      // Sin documento: el nombre va a mano.
      this.documentoBuscado = "";
      this.habilitarNombre(null, "Escribí el nombre del cliente.");
      return;
    }
    this.documentoControl.setValue(documento, { emitEvent: false });
    this.clienteId = null;
    this.buscando = true;
    this.buscar(documento)
      .pipe(
        finalize(() => (this.buscando = false)),
        untilDestroyed(this)
      )
      .subscribe((encontrado: Encontrado) => {
        // El documento cambió mientras se buscaba: esta respuesta ya no es la del campo.
        if (normalizarDocumento(this.documentoControl.value) !== documento) return;
        this.documentoBuscado = documento;
        if (encontrado?.clienteId != null) {
          this.clienteId = encontrado.clienteId;
          this.nombreControl.setValue(encontrado.nombre.toUpperCase());
          this.nombreControl.disable();
          this.enfocar(() => this.documentoInput, 0);
        } else if (encontrado?.nombre) {
          this.habilitarNombre(encontrado.nombre.toUpperCase(), "Cliente de SET: revisá el nombre.");
        } else {
          this.habilitarNombre(null, "No se encontró el cliente: escribí el nombre.");
        }
      });
  }

  /** Base de la filial (que ya consulta SET si no lo tiene) y, si no lo devolvió, SET directo. Nunca falla. */
  private buscar(documento: string): Observable<Encontrado> {
    return this.clienteService.onGetClientePorPersonaDocumento(documento, false).pipe(
      timeout(TIMEOUT_CONSULTA_MOSTRADOR_MS),
      map((cliente: Cliente) => ({ cliente, error: false })),
      catchError(() => of({ cliente: null as Cliente, error: true })),
      switchMap(({ cliente, error }) => {
        if (cliente?.id != null) {
          const nombre = nombreDe(cliente);
          return of<Encontrado>(nombre !== "" ? { clienteId: cliente.id, nombre } : {});
        }
        // Con error (no es contribuyente, red caída, corte) SET tampoco va a responder: nombre a mano.
        if (error) return of<Encontrado>({});
        return this.clienteService.onConsultaRuc(documento, false, LECTURA_ESTRICTA, true).pipe(
          timeout(TIMEOUT_CONSULTA_MOSTRADOR_MS),
          map((ruc) => ({ nombre: (ruc?.nombre ?? "").trim() } as Encontrado)),
          catchError(() => of<Encontrado>({}))
        );
      }),
      catchError(() => of<Encontrado>({}))
    );
  }

  private habilitarNombre(nombre: string, mensaje: string) {
    this.clienteId = null;
    this.nombreControl.enable();
    if (nombre != null || (this.nombreControl.value ?? "").trim() === "") this.nombreControl.setValue(nombre);
    this.mensaje = mensaje;
    this.enfocar(() => this.nombreInput, 0);
  }

  onConfirmar() {
    if (this.buscando) return;
    const nombre = (this.nombreControl.value ?? "").trim().toUpperCase();
    if (nombre === "") {
      this.mensaje = this.nombreControl.disabled
        ? "Buscá el RUC/CI del cliente o dejalo vacío y escribí el nombre."
        : "Falta el nombre del cliente.";
      this.enfocar(() => (this.nombreControl.disabled ? this.documentoInput : this.nombreInput), 0);
      return;
    }
    const documento = normalizarDocumento(this.documentoControl.value);
    const clienteId = this.clienteId != null && documento === this.documentoBuscado ? this.clienteId : null;
    this.dialogRef.close({ clienteId, documento: documento !== "" ? documento : null, nombre });
  }

  onNoParticipa() {
    this.dialogRef.close(null);
  }

  private enfocar(input: () => ElementRef, ms: number) {
    this.timers.push(setTimeout(() => input()?.nativeElement?.focus(), ms));
  }
}
