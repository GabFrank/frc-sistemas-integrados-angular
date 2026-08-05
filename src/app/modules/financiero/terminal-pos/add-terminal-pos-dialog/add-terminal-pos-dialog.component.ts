import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ProveedorServicio } from "../../../personas/proveedor-servicio/proveedor-servicio.model";
import { ProveedorServicioService } from "../../../personas/proveedor-servicio/proveedor-servicio.service";
import { Moneda } from "../../moneda/moneda.model";
import { MonedaService } from "../../moneda/moneda.service";
import { TerminalPos } from "../terminal-pos.model";
import { TerminalPosService } from "../terminal-pos.service";

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
  selectedTerminalPos: TerminalPos;
  selectedProveedorServicio: ProveedorServicio = null;
  monedas: Moneda[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddTerminalPosData,
    private matDialogRef: MatDialogRef<AddTerminalPosDialogComponent>,
    private terminalPosService: TerminalPosService,
    private monedaService: MonedaService,
    private proveedorServicioService: ProveedorServicioService
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
      activo: this.activoControl,
    });

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
    this.selectedProveedorServicio =
      this.selectedTerminalPos.proveedorServicio ?? null;
    this.proveedorServicioControl.setValue(
      this.selectedProveedorServicio?.persona?.nombre ?? null
    );
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
    input.proveedorServicioId = this.selectedProveedorServicio?.id ?? null;

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
