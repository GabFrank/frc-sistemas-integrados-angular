import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MOTIVOS_NO_COMPLETADO } from '../venta-tarjeta.model';

export interface MotivoNoConciliarData {
  /** Cuántos cobros se van a marcar. 1 = uno solo; más = el cierre de caja completo. */
  cuantos: number;
}

export interface MotivoNoConciliarResultado {
  motivo: string;
  observacion: string;
}

/**
 * Por qué este cobro se queda sin conciliar.
 *
 * <b>El motivo no es burocracia.</b> `NO_COMPLETADO` es terminal: ese cobro ya no se registra
 * nunca y su plata queda sin cupón contra el cual conciliar la liquidación del proveedor. Lo que
 * se escriba acá es todo lo que va a existir cuando alguien revise esa caja la semana que viene.
 *
 * Lista fija más texto libre, y no sólo texto libre: con texto libre cada cajero escribe distinto
 * y después no se puede responder «cuántas veces falló el POS este mes». El texto libre queda para
 * el caso que la lista no cubre, y ahí sí es obligatorio.
 */
@Component({
  selector: 'app-motivo-no-conciliar-dialog',
  templateUrl: './motivo-no-conciliar-dialog.component.html',
  styleUrls: ['./motivo-no-conciliar-dialog.component.scss'],
})
export class MotivoNoConciliarDialogComponent {

  motivos = MOTIVOS_NO_COMPLETADO;

  motivoControl = new FormControl(null, Validators.required);
  observacionControl = new FormControl('');

  /** Se recalcula al elegir, no desde el template: el template no puede llamar funciones. */
  exigeTexto = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MotivoNoConciliarData,
    private dialogRef: MatDialogRef<MotivoNoConciliarDialogComponent>
  ) {
    this.motivoControl.valueChanges.subscribe((v) => {
      this.exigeTexto = v === 'OTRO';
      // "Otro" sin texto no dice nada: es exactamente el caso que la lista no cubre.
      if (this.exigeTexto) {
        this.observacionControl.setValidators(Validators.required);
      } else {
        this.observacionControl.clearValidators();
      }
      this.observacionControl.updateValueAndValidity();
    });
  }

  onConfirmar(): void {
    this.motivoControl.markAsTouched();
    this.observacionControl.markAsTouched();
    if (this.motivoControl.invalid || this.observacionControl.invalid) return;
    this.dialogRef.close({
      motivo: this.motivoControl.value,
      observacion: (this.observacionControl.value || '').trim() || null,
    } as MotivoNoConciliarResultado);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
