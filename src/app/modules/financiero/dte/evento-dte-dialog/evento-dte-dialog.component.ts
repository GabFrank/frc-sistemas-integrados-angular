import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export interface EventoDteDialogData {
  titulo?: string;
  tipoEvento: number;
}

@Component({
  selector: "app-evento-dte-dialog",
  templateUrl: "./evento-dte-dialog.component.html",
  styleUrls: ["./evento-dte-dialog.component.scss"],
})
export class EventoDteDialogComponent implements OnInit {
  form = new FormGroup({
    motivo: new FormControl<string>("", { nonNullable: true }),
    observacion: new FormControl<string>("", { nonNullable: true }),
  });

  motivoLabel = "Motivo";
  observacionLabel = "Observación";
  showMotivoRequiredHint = false;
  showObservacionRequiredHint = false;

  constructor(
    private dialogRef: MatDialogRef<EventoDteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventoDteDialogData
  ) {}

  ngOnInit(): void {
    // Reset validators
    this.form.controls.motivo.clearValidators();
    this.form.controls.observacion.clearValidators();

    switch (this.data?.tipoEvento) {
      case 1: // Cancelación
        this.motivoLabel = "Motivo de cancelación";
        this.observacionLabel = "Observación (opcional)";
        this.form.controls.motivo.setValidators([Validators.required, Validators.maxLength(500)]);
        this.form.controls.observacion.setValidators([Validators.maxLength(2000)]);
        this.showMotivoRequiredHint = true;
        this.showObservacionRequiredHint = false;
        break;
      case 2: // Conformidad
        this.motivoLabel = "Motivo (opcional)";
        this.observacionLabel = "Observación (opcional)";
        this.form.controls.motivo.setValidators([Validators.maxLength(500)]);
        this.form.controls.observacion.setValidators([Validators.maxLength(2000)]);
        this.showMotivoRequiredHint = false;
        this.showObservacionRequiredHint = false;
        break;
      case 3: // Disconformidad
        this.motivoLabel = "Motivo de disconformidad";
        this.observacionLabel = "Observación (requerido)";
        this.form.controls.motivo.setValidators([Validators.required, Validators.minLength(5), Validators.maxLength(500)]);
        this.form.controls.observacion.setValidators([Validators.required, Validators.minLength(5), Validators.maxLength(2000)]);
        this.showMotivoRequiredHint = true;
        this.showObservacionRequiredHint = true;
        break;
      case 4: // Inutilización
        this.motivoLabel = "Motivo de inutilización";
        this.observacionLabel = "Observación (opcional)";
        this.form.controls.motivo.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(500)]);
        this.form.controls.observacion.setValidators([Validators.maxLength(2000)]);
        this.showMotivoRequiredHint = true;
        this.showObservacionRequiredHint = false;
        break;
      default:
        this.form.controls.motivo.setValidators([Validators.maxLength(500)]);
        this.form.controls.observacion.setValidators([Validators.maxLength(2000)]);
        this.showMotivoRequiredHint = false;
        this.showObservacionRequiredHint = false;
        break;
    }

    this.form.controls.motivo.updateValueAndValidity();
    this.form.controls.observacion.updateValueAndValidity();
  }

  cancelar() {
    this.dialogRef.close();
  }

  confirmar() {
    if (this.form.invalid) return;
    const { motivo, observacion } = this.form.getRawValue();
    this.dialogRef.close({ motivo, observacion });
  }
}
