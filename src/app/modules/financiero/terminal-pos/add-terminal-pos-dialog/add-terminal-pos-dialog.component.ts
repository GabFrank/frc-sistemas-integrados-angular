import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ProveedorServicio } from "../../../personas/proveedor-servicio/proveedor-servicio.model";
import { ProveedorServicioService } from "../../../personas/proveedor-servicio/proveedor-servicio.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { Moneda } from "../../moneda/moneda.model";
import { MonedaService } from "../../moneda/moneda.service";
import { TerminalPos } from "../terminal-pos.model";
import { TerminalPosService } from "../terminal-pos.service";
import {
  FormatoTerminalPos,
  TIPOS_FORMATO_TERMINAL,
} from "../../venta-tarjeta/qr-pos/formato-terminal-pos/formato-terminal-pos.model";
import { FormatoTerminalPosService } from "../../venta-tarjeta/qr-pos/formato-terminal-pos/formato-terminal-pos.service";

export class AddTerminalPosData {
  terminalPos?: TerminalPos;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-add-terminal-pos-dialog",
  templateUrl: "./add-terminal-pos-dialog.component.html",
  styleUrls: ["./add-terminal-pos-dialog.component.scss"],
})
export class AddTerminalPosDialogComponent implements OnInit {

  formGroup: FormGroup;
  isEditting = false;

  descripcionControl = new FormControl(null, Validators.required);
  codigoControl = new FormControl(null, Validators.required);
  monedaControl = new FormControl(null, Validators.required);
  activoControl = new FormControl(true);
  proveedorServicioControl = new FormControl(null);
  /**
   * Donde esta fisicamente el aparato. Opcional a proposito: las terminales viejas no la tienen y
   * no se puede adivinar, asi que exigirla en la edicion trabaria el guardado de todas.
   */
  sucursalControl = new FormControl(null);
  /**
   * El identificador propio de la maquina. Distinto de `codigo`, que es la etiqueta interna que el
   * cajero escanea. El backend lo normaliza a mayusculas y rechaza repetidos con el motivo.
   */
  serieControl = new FormControl(null);
  sucursales: Sucursal[] = [];
  /**
   * Sin formato, el PDV bloquea la venta con tarjeta en esta terminal. Por eso es obligatorio en
   * el alta: dejar crear una terminal que no puede vender seria crear un problema para despues.
   *
   * En la EDICION no se fuerza, para no trabar el guardado de una terminal vieja que todavia no
   * tiene formato asignado --que el dia del corte son todas.
   */
  formatoControl = new FormControl(null);
  /**
   * La etiqueta del tipo viene calculada en cada fila: este repo prohibe llamar funciones desde el
   * HTML porque se re-evaluan en cada ciclo de change detection.
   */
  formatos: Array<FormatoTerminalPos & { tipoEtiqueta: string }> = [];
  /** Campo y no getter, por lo mismo. Se actualiza desde valueChanges del select. */
  ayudaFormato: string = null;
  selectedTerminalPos: TerminalPos;
  selectedProveedorServicio: ProveedorServicio = null;
  monedas: Moneda[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddTerminalPosData,
    private matDialogRef: MatDialogRef<AddTerminalPosDialogComponent>,
    private terminalPosService: TerminalPosService,
    private monedaService: MonedaService,
    private proveedorServicioService: ProveedorServicioService,
    private formatoTerminalPosService: FormatoTerminalPosService,
    private sucursalService: SucursalService
  ) {
    if (data?.terminalPos != null) {
      this.selectedTerminalPos = data.terminalPos;
    }
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      descripcion: this.descripcionControl,
      codigo: this.codigoControl,
      moneda: this.monedaControl,
      proveedorServicio: this.proveedorServicioControl,
      formatoTerminalPos: this.formatoControl,
      sucursal: this.sucursalControl,
      serie: this.serieControl,
      activo: this.activoControl,
    });

    this.sucursalService.onGetAllSucursales(true)
      .pipe(untilDestroyed(this))
      .subscribe(res => { this.sucursales = res ?? []; });

    // Contra el CENTRAL: es la pantalla de administracion y ahi estan todos, incluidos los que
    // todavia no bajaron por replicacion a este filial.
    this.formatoTerminalPosService.onGetActivos(true)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.formatos = (res ?? []).map(f => ({
          ...f,
          tipoEtiqueta:
            TIPOS_FORMATO_TERMINAL.find(t => t.valor === f.tipo)?.etiqueta ?? f.tipo ?? "",
        }));
        // Si la terminal ya traia un formato, la ayuda se arma recien cuando llega la lista.
        this.refrescarAyudaFormato();
      });

    this.formatoControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.refrescarAyudaFormato());

    // En el alta si es obligatorio; en la edicion no, para no trabar una terminal vieja sin
    // formato. Ver el comentario de formatoControl.
    if (this.selectedTerminalPos == null) {
      this.formatoControl.setValidators(Validators.required);
    }

    this.monedaService.onGetAll(true)
      .pipe(untilDestroyed(this))
      .subscribe(res => { this.monedas = res ?? []; });

    if (this.selectedTerminalPos != null) {
      this.cargarDatos();
      this.isEditting = false;
      this.formGroup.disable();
    } else {
      this.isEditting = true;
      this.formGroup.enable();
    }
  }

  cargarDatos() {
    this.descripcionControl.setValue(this.selectedTerminalPos.descripcion);
    this.codigoControl.setValue(this.selectedTerminalPos.codigo);
    this.monedaControl.setValue(this.selectedTerminalPos.moneda?.id ?? null);
    this.activoControl.setValue(this.selectedTerminalPos.activo);
    this.formatoControl.setValue(this.selectedTerminalPos.formatoTerminalPos?.id ?? null);
    this.sucursalControl.setValue(this.selectedTerminalPos.sucursal?.id ?? null);
    this.serieControl.setValue(this.selectedTerminalPos.serie ?? null);
    this.selectedProveedorServicio =
      this.selectedTerminalPos.proveedorServicio ?? null;
    this.proveedorServicioControl.setValue(
      this.selectedProveedorServicio?.persona?.nombre ?? null
    );
  }

  /**
   * Que camino le abre a la caja el formato elegido, y cual le cierra. Es lo que el administrador
   * necesita saber al elegir: una terminal WEB no va a ofrecer la camara, y una MAQUINA no va a
   * ofrecer el lector.
   */
  private refrescarAyudaFormato(): void {
    const elegido = this.formatos.find(f => f.id === this.formatoControl.value);
    this.ayudaFormato = elegido
      ? TIPOS_FORMATO_TERMINAL.find(t => t.valor === elegido.tipo)?.ayuda ?? null
      : null;
  }

  onBuscarProveedorServicio() {
    if (!this.isEditting) return;
    this.proveedorServicioService
      .onSearchProveedorServicioPorTexto(null)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res?.id != null) {
          this.selectedProveedorServicio = res;
          this.proveedorServicioControl.setValue(res.persona?.nombre ?? null);
        }
      });
  }

  onLimpiarProveedorServicio() {
    if (!this.isEditting) return;
    this.selectedProveedorServicio = null;
    this.proveedorServicioControl.setValue(null);
  }

  onSave() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    let terminalPos = new TerminalPos();
    if (this.selectedTerminalPos != null) {
      Object.assign(terminalPos, this.selectedTerminalPos);
    }
    terminalPos.descripcion = this.descripcionControl.value?.toUpperCase();
    terminalPos.codigo = this.codigoControl.value?.toUpperCase();
    terminalPos.activo = this.activoControl.value;

    const input = terminalPos.toInput();
    input.monedaId = this.monedaControl.value ?? undefined;
    // Se mandan solo si hay algo: mandar null NO desasigna --el backend conserva lo que tenia--
    // porque un desktop viejo que no conoce estos campos no puede borrar lo que alguien cargo a
    // mano sobre 24 sucursales.
    if (this.sucursalControl.value != null) {
      input.sucursalId = this.sucursalControl.value;
    }
    const serie = (this.serieControl.value ?? '').trim();
    if (serie !== '') {
      input.serie = serie;
    }
    input.proveedorServicioId = this.selectedProveedorServicio?.id ?? null;
    // Se manda solo si hay algo elegido. Mandar null NO desasigna --el backend conserva lo que
    // tenia-- y eso es a proposito: desvincular un formato apaga la venta con tarjeta de esa caja
    // y tiene su propia accion explicita.
    if (this.formatoControl.value != null) {
      input.formatoTerminalPosId = this.formatoControl.value;
    }

    this.terminalPosService
      .onSave(input)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.matDialogRef.close(res);
        }
      });
  }

  onCancel() {
    this.matDialogRef.close();
  }

  onHabilitarEdicion() {
    this.isEditting = true;
    this.formGroup.enable();
  }
}
