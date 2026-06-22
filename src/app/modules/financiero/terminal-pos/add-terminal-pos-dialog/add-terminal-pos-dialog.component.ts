import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
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

  //Form Controls
  descripcionControl = new FormControl(null, Validators.required);
  codigoControl = new FormControl(null, Validators.required);
  activoControl = new FormControl(true);
  selectedTerminalPos: TerminalPos;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddTerminalPosData,
    private matDialogRef: MatDialogRef<AddTerminalPosDialogComponent>,
    private terminalPosService: TerminalPosService
  ) {
    if (data?.terminalPos != null) {
      this.selectedTerminalPos = data.terminalPos;
    }
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      descripcion: this.descripcionControl,
      codigo: this.codigoControl,
      activo: this.activoControl,
    });

    if (this.selectedTerminalPos != null) {
      this.cargarDatos();
      // Editar: arranca en modo lectura hasta que el usuario habilite la edicion
      this.isEditting = false;
      this.formGroup.disable();
    } else {
      // Nuevo: edicion habilitada de entrada
      this.isEditting = true;
      this.formGroup.enable();
    }
  }

  cargarDatos() {
    this.descripcionControl.setValue(this.selectedTerminalPos.descripcion);
    this.codigoControl.setValue(this.selectedTerminalPos.codigo);
    this.activoControl.setValue(this.selectedTerminalPos.activo);
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

    this.terminalPosService
      .onSave(terminalPos.toInput())
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
