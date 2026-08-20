import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

/** Rango elegido, devuelto al cerrar. */
export interface RangoPenalizaciones {
  desde: Date;
  hasta: Date;
}

/**
 * Pide el rango a procesar para la generacion automatica de penalizaciones.
 *
 * Antes solo permitia un dia, asi que ponerse al dia con una semana atrasada eran siete
 * pasadas manuales. La generacion es idempotente por jornada, no por fecha: re-correr un
 * rango que se solapa con otro ya procesado no duplica nada.
 */
@Component({
  selector: 'app-generar-penalizaciones-dialog',
  templateUrl: './generar-penalizaciones-dialog.component.html',
  styleUrls: ['./generar-penalizaciones-dialog.component.scss']
})
export class GenerarPenalizacionesDialogComponent {

  /** Igual al tope del backend (PenalizacionService.RANGO_MAX_DIAS). */
  static readonly MAX_DIAS = 62;

  desdeControl = new FormControl(null, [Validators.required]);
  hastaControl = new FormControl(null, [Validators.required]);
  hoy = new Date();

  /** Precalculado: el template no llama funciones (convencion del repo). */
  error = '';
  cantidadDias = 1;

  constructor(private dialogRef: MatDialogRef<GenerarPenalizacionesDialogComponent>) {
    // Por defecto el dia anterior en ambos extremos: lo normal sigue siendo procesar la
    // jornada ya cerrada, y quien necesite mas corre el "hasta".
    const h = new Date();
    const ayer = new Date(h.getFullYear(), h.getMonth(), h.getDate() - 1);
    this.desdeControl.setValue(ayer);
    this.hastaControl.setValue(ayer);
    this.desdeControl.valueChanges.subscribe(() => this.recalcular());
    this.hastaControl.valueChanges.subscribe(() => this.recalcular());
  }

  private recalcular() {
    const d: Date = this.desdeControl.value;
    const h: Date = this.hastaControl.value;
    this.error = '';
    this.cantidadDias = 0;
    if (d == null || h == null) { return; }
    if (h < d) {
      this.error = 'La fecha final no puede ser anterior a la inicial';
      return;
    }
    const ms = h.getTime() - d.getTime();
    this.cantidadDias = Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
    if (this.cantidadDias > GenerarPenalizacionesDialogComponent.MAX_DIAS) {
      this.error = 'El rango no puede superar ' + GenerarPenalizacionesDialogComponent.MAX_DIAS
        + ' días (elegiste ' + this.cantidadDias + ')';
    }
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGenerar() {
    if (this.desdeControl.invalid || this.hastaControl.invalid || this.error) { return; }
    this.dialogRef.close({ desde: this.desdeControl.value, hasta: this.hastaControl.value });
  }
}
