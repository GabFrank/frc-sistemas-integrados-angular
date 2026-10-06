import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Chequera, EstadoChequera } from '../../chequera/chequera.model';
import { ChequeraService } from '../../chequera/chequera.service';
import { ChequeService } from '../cheque.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';

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
    if (this.isSaving) return;
    const cuenta = ch?.cuentaBancaria;
    const total = this.totalControl.value;

    this.isSaving = true;
    // Mientras se guarda no se cierra (ni Esc ni clic afuera): el dashboard no se releería.
    this.dialogRef.disableClose = true;
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
        this.dialogRef.disableClose = false;
        if (res != null) {
          this.notificacion.openSucess(diferido ? 'Cheque diferido emitido' : 'Cheque emitido y cobrado');
          this.dialogRef.close(true);
        } else {
          this.sinConfirmar(ch, total, diferido, true);
        }
      },
      error: err => {
        this.isSaving = false;
        this.dialogRef.disableClose = false;
        const rechazo = erroresDeRechazo(err);
        if (rechazo) {
          // El servidor dijo que no: no se emitió nada. Queda el formulario para corregir y reintentar.
          this.notificacion.openAlgoSalioMal(rechazo[0]?.message || err?.message || 'No se pudo emitir el cheque');
          return;
        }
        // El corte del link ya avisó que pudo haberse aplicado.
        this.sinConfirmar(ch, total, diferido, !esTimeoutDeLink(err));
      },
    });
  }

  /**
   * El cheque pudo haberse emitido, y repetir el pedido emite otro con el número siguiente y vuelve a debitar o
   * reservar (#390). Se cierra: con el formulario abierto, reintentar es un clic. El aviso no manda al dashboard de
   * cheques porque ahí puede no verse (un cheque al día no figura; uno diferido, solo si su fecha cae en el rango
   * filtrado): lo que sí cambia siempre es el próximo número de la chequera.
   */
  private sinConfirmar(ch: Chequera, total: number, diferido: boolean, avisar: boolean) {
    if (avisar) {
      const numero = ch?.siguienteNumero != null ? ` Nº ${ch.siguienteNumero}` : '';
      const monto = `${ch?.cuentaBancaria?.moneda?.simbolo || ''} ${(total || 0).toLocaleString('es-PY')}`.trim();
      const chequera = ch?.nombre || ('chequera #' + ch?.id);
      const donde = diferido
        ? 'fijate en Chequeras si el próximo número avanzó'
        : 'fijate en Chequeras si el próximo número avanzó y en los movimientos de la cuenta';
      this.notificacion.openWarn(
        `No se pudo confirmar si se emitió el cheque${numero} (${chequera}, ${monto}): ${donde} antes de emitirlo de nuevo.`, 12);
    }
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
