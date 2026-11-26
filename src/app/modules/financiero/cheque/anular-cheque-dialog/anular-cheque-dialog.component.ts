import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AnulacionChequeInput, Cheque, MOTIVOS_ANULACION_CHEQUE, MotivoAnulacionCheque } from '../cheque.model';

export interface AnularChequeDialogData {
  /** Los cheques que se anulan (uno, o todos los del pago). */
  cheques: Cheque[];
  /** Qué más se anula con ellos: «Se anula el pago #12…». */
  detalle?: string;
}

interface FilaCheque {
  numero: string;
  beneficiario: string;
  monto: string;
}

/**
 * Motivo de la lista y observación para anular uno o varios cheques (#807). Cierra con el input, o con null si el
 * usuario vuelve atrás: en ese caso no se anula nada (tampoco el pago).
 */
@UntilDestroy()
@Component({
  selector: 'app-anular-cheque-dialog',
  templateUrl: './anular-cheque-dialog.component.html',
  styleUrls: ['./anular-cheque-dialog.component.scss'],
})
export class AnularChequeDialogComponent {
  readonly motivos = MOTIVOS_ANULACION_CHEQUE;
  form = new FormGroup({
    motivo: new FormControl<MotivoAnulacionCheque | null>(null, Validators.required),
    observacion: new FormControl(''),
  });
  filas: FilaCheque[];
  titulo: string;
  obsObligatoria = false;

  constructor(
    private dialogRef: MatDialogRef<AnularChequeDialogComponent, AnulacionChequeInput | null>,
    @Inject(MAT_DIALOG_DATA) public data: AnularChequeDialogData,
  ) {
    const cheques = data?.cheques || [];
    this.titulo = cheques.length > 1 ? 'Anular ' + cheques.length + ' cheques' : 'Anular cheque';
    this.filas = cheques.map(c => ({
      numero: c.numero != null ? String(c.numero) : '—',
      beneficiario: c.beneficiario || c.proveedor?.persona?.nombre || '—',
      // Sin la lectura del cheque (inutilizar con NO_LEIDO) solo se sabe el número.
      monto: c.total != null ? (c.moneda?.simbolo || '') + ' ' + c.total.toLocaleString('es-PY') : '—',
    }));
    // Con OTRO la observación es obligatoria: la exige también el central.
    this.form.controls.motivo.valueChanges.pipe(untilDestroyed(this)).subscribe(m => {
      this.obsObligatoria = m === MotivoAnulacionCheque.OTRO;
      this.form.controls.observacion.setValidators(this.obsObligatoria ? [Validators.required, Validators.pattern(/\S/)] : null);
      this.form.controls.observacion.updateValueAndValidity();
    });
  }

  onConfirmar(): void {
    if (this.form.invalid) return;
    const obs = (this.form.controls.observacion.value || '').trim().toUpperCase();
    this.dialogRef.close({ motivo: this.form.controls.motivo.value, observacion: obs || null });
  }

  onVolver(): void {
    this.dialogRef.close(null);
  }
}
