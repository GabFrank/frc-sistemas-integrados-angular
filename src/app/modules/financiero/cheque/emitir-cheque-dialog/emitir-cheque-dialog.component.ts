import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Chequera, EstadoChequera } from '../../chequera/chequera.model';
import { ChequeraService } from '../../chequera/chequera.service';
import { ChequeService } from '../cheque.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-emitir-cheque-dialog',
  templateUrl: './emitir-cheque-dialog.component.html',
  styleUrls: ['./emitir-cheque-dialog.component.scss'],
})
export class EmitirChequeDialogComponent implements OnInit {

  formGroup: FormGroup;
  chequeraControl = new FormControl(null, Validators.required);
  totalControl = new FormControl(null, [Validators.required, Validators.min(0.01)]);
  diferidoControl = new FormControl(false);
  fechaPagoControl = new FormControl(null);
  conceptoControl = new FormControl('');

  chequeras: Chequera[] = [];
  chequeraSel: Chequera | null = null;   // para mostrar cuenta/moneda/hojas
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<EmitirChequeDialogComponent>,
    private chequeraService: ChequeraService,
    private chequeService: ChequeService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      chequeraControl: this.chequeraControl,
      totalControl: this.totalControl,
      diferidoControl: this.diferidoControl,
      fechaPagoControl: this.fechaPagoControl,
      conceptoControl: this.conceptoControl,
    });

    this.chequeraService.onGetChequeras(0, 200).pipe(untilDestroyed(this)).subscribe(res => {
      // Solo chequeras activas con hojas disponibles.
      this.chequeras = (res || []).filter(
        c => c.estado === EstadoChequera.ACTIVA && (c.hojasDisponibles == null || c.hojasDisponibles > 0));
    });
  }

  onChequeraChange(ch: Chequera) {
    this.chequeraSel = ch;
  }

  onSave() {
    if (this.formGroup.invalid) {
      this.notificacion.openAlgoSalioMal('Complete chequera y monto');
      return;
    }
    const ch = this.chequeraControl.value as Chequera;
    const diferido = !!this.diferidoControl.value;
    if (diferido && !this.fechaPagoControl.value) {
      this.notificacion.openAlgoSalioMal('Un cheque diferido requiere fecha de pago');
      return;
    }
    const cuenta = ch?.cuentaBancaria;

    this.isSaving = true;
    this.chequeService.onEmitirManual({
      chequeraId: ch.id,
      total: this.totalControl.value,
      diferido,
      monedaId: cuenta?.moneda?.id,
      cuentaBancariaId: cuenta?.id,
      fechaPago: diferido ? dateToString(this.fechaPagoControl.value, 'yyyy-MM-dd') : null,
      concepto: this.conceptoControl.value ? String(this.conceptoControl.value).toUpperCase() : null,
    }).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        if (res != null) {
          this.notificacion.openSucess(diferido ? 'Cheque diferido emitido' : 'Cheque emitido y cobrado');
          this.dialogRef.close(true);
        }
      },
      error: err => {
        this.isSaving = false;
        const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo emitir el cheque';
        this.notificacion.openAlgoSalioMal(msg);
      },
    });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
