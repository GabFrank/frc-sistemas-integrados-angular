import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

/**
 * Pide la fecha a procesar para la generacion automatica de penalizaciones.
 *
 * Antes este campo vivia suelto entre los filtros de la lista, con el label cortado:
 * parecia un filtro mas y no el parametro de la accion, asi que se generaba sobre una
 * fecha equivocada sin entender por que no salia nada.
 */
@Component({
  selector: 'app-generar-penalizaciones-dialog',
  templateUrl: './generar-penalizaciones-dialog.component.html',
  styleUrls: ['./generar-penalizaciones-dialog.component.scss']
})
export class GenerarPenalizacionesDialogComponent {

  fechaControl = new FormControl(null, [Validators.required]);
  hoy = new Date();

  constructor(private dialogRef: MatDialogRef<GenerarPenalizacionesDialogComponent>) {
    // por defecto el dia anterior: lo normal es procesar la jornada ya cerrada
    const h = new Date();
    this.fechaControl.setValue(new Date(h.getFullYear(), h.getMonth(), h.getDate() - 1));
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGenerar() {
    if (this.fechaControl.invalid) return;
    this.dialogRef.close(this.fechaControl.value);
  }
}
