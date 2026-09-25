import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface MotivoDialogData {
  titulo: string;
  mensaje: string;
  /** Texto secundario: qué pasa al confirmar. */
  detalle?: string;
  etiqueta?: string;
  botonConfirmar: string;
}

/**
 * Pide un motivo obligatorio antes de una acción que cambia el estado de un documento
 * (cancelar, devolver). Cierra con el motivo en mayúsculas, o con null si el usuario vuelve atrás.
 */
@Component({
  selector: 'app-motivo-dialog',
  templateUrl: './motivo-dialog.component.html',
  styleUrls: ['./motivo-dialog.component.scss'],
})
export class MotivoDialogComponent {
  // El pattern rechaza un motivo hecho solo de espacios.
  motivoControl = new FormControl('', [Validators.required, Validators.pattern(/\S/)]);
  etiqueta: string;

  constructor(
    private dialogRef: MatDialogRef<MotivoDialogComponent, string | null>,
    @Inject(MAT_DIALOG_DATA) public data: MotivoDialogData,
  ) {
    this.etiqueta = data.etiqueta || 'Motivo';
  }

  onConfirmar(): void {
    if (this.motivoControl.invalid) return;
    this.dialogRef.close((this.motivoControl.value || '').trim().toUpperCase());
  }

  onVolver(): void {
    this.dialogRef.close(null);
  }
}
