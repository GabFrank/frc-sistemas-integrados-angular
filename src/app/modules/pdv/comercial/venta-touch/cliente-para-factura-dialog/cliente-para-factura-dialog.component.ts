import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { finalize, timeout } from "rxjs/operators";
import { TIMEOUT_CONSULTA_MOSTRADOR_MS } from "../../../../../generics/generic-crud.constantes";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { erroresDeRechazo } from "../../../../../commons/core/utils/graphqlErrorUtils";
import { Cliente } from "../../../../personas/clientes/cliente.model";
import { ClienteService } from "../../../../personas/clientes/cliente.service";
import { PersonaSearchGQL } from "../../../../personas/persona/graphql/personaSearch";
import { Persona } from "../../../../personas/persona/persona.model";
import { esClienteNominado } from "./cliente-nominado";

const SIN_CLIENTE = "No se encontró un cliente con ese documento. Para cargarlo, cancele y cobre con el botón de factura.";

function normalizarDocumento(valor: any): string {
  return ((valor || "") + "").trim().split("-")[0];
}

export class ClienteParaFacturaDialogData {
  totalGs: number;
}

/**
 * Pide el cliente de una venta que el filial rechazó porque lleva factura electrónica sin nombre y
 * llega a 7.000.000 (#473). Devuelve un cliente del filial con nombre y documento, o null si el
 * cajero cancela. No crea clientes: eso se hace desde la factura del cobro.
 */
@UntilDestroy()
@Component({
  selector: "app-cliente-para-factura-dialog",
  templateUrl: "./cliente-para-factura-dialog.component.html",
  styleUrls: ["./cliente-para-factura-dialog.component.scss"],
})
export class ClienteParaFacturaDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild("documentoInput", { static: false }) documentoInput: ElementRef;

  documentoControl = new FormControl<string>(null);
  buscando = false;
  cliente: Cliente = null;
  clienteNombre: string = null;
  clienteDocumento: string = null;
  mensaje: string = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ClienteParaFacturaDialogData,
    private dialogRef: MatDialogRef<ClienteParaFacturaDialogComponent>,
    private clienteService: ClienteService,
    private personaSearch: PersonaSearchGQL,
    private dialog: MatDialog
  ) {
    // El cliente mostrado vale solo para el documento con el que se lo buscó: si el cajero lo
    // cambia, hay que buscar de nuevo antes de poder guardar.
    this.documentoControl.valueChanges.pipe(untilDestroyed(this)).subscribe((valor) => {
      if (this.cliente != null && normalizarDocumento(valor) !== this.documentoBuscado) this.limpiarCliente();
    });
  }

  private documentoBuscado: string = null;
  private focoInicial: any = null;

  // El diálogo se abre mientras se cierra el de «Guardando…», que al terminar le devuelve el foco
  // al buscador del PDV: sin esto el cajero escribiría el documento ahí.
  ngAfterViewInit(): void {
    this.focoInicial = setTimeout(() => this.documentoInput?.nativeElement?.focus(), 400);
  }

  ngOnDestroy(): void {
    clearTimeout(this.focoInicial);
  }

  private limpiarCliente() {
    this.cliente = null;
    this.clienteNombre = null;
    this.clienteDocumento = null;
  }

  onBuscar() {
    if (this.buscando) return;
    const documento = normalizarDocumento(this.documentoControl.value);
    if (documento === "") {
      this.onBuscarPorNombre();
      return;
    }
    this.limpiarCliente();
    this.documentoControl.setValue(documento);
    this.documentoBuscado = documento;
    this.mensaje = null;
    this.buscando = true;
    // Contra el filial: es quien después resuelve el clienteId de la venta. No sirve la consulta
    // «detallada» del diálogo de factura: a un cliente que ya existe pero no es contribuyente (el caso
    // común, con cédula) la devuelve sin cliente, porque SET no lo conoce.
    this.clienteService
      .onGetClientePorPersonaDocumento(documento, false)
      .pipe(
        timeout(TIMEOUT_CONSULTA_MOSTRADOR_MS),
        finalize(() => (this.buscando = false)),
        untilDestroyed(this)
      )
      .subscribe({
        next: (encontrado: Cliente) => {
          // El documento cambió mientras se buscaba: esta respuesta ya no es la del campo.
          if (normalizarDocumento(this.documentoControl.value) !== documento) return;
          if (esClienteNominado(encontrado)) {
            this.cliente = encontrado;
            this.clienteNombre = (encontrado.persona?.nombre ?? encontrado.nombre)?.toUpperCase();
            this.clienteDocumento = encontrado.persona?.documento ?? encontrado.documento;
          } else if (encontrado?.id != null) {
            this.mensaje = "El cliente no tiene nombre o documento válidos para facturar.";
          } else {
            this.mensaje = SIN_CLIENTE;
          }
        },
        error: (err) => {
          // El filial responde con error cuando el documento no es de un cliente ni de un
          // contribuyente de SET; onGetByTexto lo entrega como { message, errors }. Cualquier otra
          // falla (red, corte por tiempo) es no haber podido buscar.
          const rechazo = erroresDeRechazo(err?.errors) != null && !err?.networkError;
          this.mensaje = rechazo ? SIN_CLIENTE : "No se pudo buscar el cliente. Intente de nuevo.";
        },
      });
  }

  onBuscarPorNombre() {
    if (this.buscando) return;
    const data: SearchListtDialogData = {
      titulo: "Buscar Persona",
      query: this.personaSearch,
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "nombre", nombre: "Nombre", width: "70%" },
        { id: "documento", nombre: "Documento/Ruc", width: "20%" },
      ],
      search: true,
      isServidor: false,
    };
    this.dialog
      .open(SearchListDialogComponent, { data, height: "50%", width: "50%" })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: Persona) => {
        // Es una persona, no un cliente del filial: solo sirve su documento.
        if (res?.documento != null) {
          this.documentoControl.setValue(res.documento);
          this.onBuscar();
        }
      });
  }

  onAceptar() {
    if (this.cliente == null) return;
    this.dialogRef.close(this.cliente);
  }

  onCancelar() {
    this.dialogRef.close(null);
  }
}
