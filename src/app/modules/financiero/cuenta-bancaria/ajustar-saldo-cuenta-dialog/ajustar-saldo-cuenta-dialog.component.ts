import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CuentaBancaria } from '../cuenta-bancaria.model';
import { CuentaBancariaService } from '../cuenta-bancaria.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';

export interface AjustarSaldoCuentaData {
  cuentaBancaria: CuentaBancaria;
}

/**
 * Corrección del saldo de una cuenta bancaria contra el extracto real.
 *
 * <p>Un ajuste no tiene contrapartida: es plata que aparece o desaparece del ledger. Por eso el
 * motivo es obligatorio (queda en la descripción del movimiento, que es toda su trazabilidad) y
 * se confirma mostrando el saldo resultante antes de aplicarlo.</p>
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-ajustar-saldo-cuenta-dialog',
  templateUrl: './ajustar-saldo-cuenta-dialog.component.html',
  styleUrls: ['./ajustar-saldo-cuenta-dialog.component.scss']
})
export class AjustarSaldoCuentaDialogComponent implements OnInit {

  /** true = suma al saldo, false = resta. */
  positivo = true;
  montoControl = new FormControl(null, [Validators.required, Validators.min(0.0001)]);
  motivoControl = new FormControl('', [Validators.required, Validators.minLength(4)]);

  saldoActual = 0;
  monedaSimbolo = '';
  monedaDenominacion = '';
  currencyOpts: any;
  isSaving = false;
  /** Hay una confirmación abierta: otro clic en «Guardar» abriría una segunda y se aplicarían dos ajustes. */
  private confirmando = false;

  /** Saldo que va a quedar. Se recalcula al tipear; el template solo lo lee. */
  saldoResultante = 0;

  constructor(
    private dialogRef: MatDialogRef<AjustarSaldoCuentaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AjustarSaldoCuentaData,
    private cuentaBancariaService: CuentaBancariaService,
    private dialogos: DialogosService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    const cta: any = this.data.cuentaBancaria;
    this.saldoActual = cta?.saldo || 0;
    this.monedaSimbolo = cta?.moneda?.simbolo || '';
    this.monedaDenominacion = cta?.moneda?.denominacion || '';
    this.currencyOpts = this.buildCurrencyOptions(cta?.moneda);
    this.recalcular();

    this.montoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.recalcular());
  }

  onCambiarSigno(positivo: boolean): void {
    this.positivo = positivo;
    this.recalcular();
  }

  private recalcular(): void {
    const monto = Math.abs(Number(this.montoControl.value) || 0);
    this.saldoResultante = this.saldoActual + (this.positivo ? monto : -monto);
  }

  private buildCurrencyOptions(moneda: any): any {
    const decimales = moneda?.decimales != null
      ? moneda.decimales
      : ((moneda?.denominacion || '').toUpperCase().includes('GUARANI') ? 0 : 2);
    return {
      align: 'right', allowNegative: false, decimal: ',', precision: decimales, thousands: '.',
      prefix: moneda?.simbolo ? moneda.simbolo + ' ' : '', suffix: '', nullable: true, min: 0, max: null,
    };
  }

  onGuardar(): void {
    if (this.montoControl.invalid) return this.err('Ingresá un monto mayor a cero');
    if (this.motivoControl.invalid) return this.err('El motivo es obligatorio (mín. 4 caracteres)');

    if (this.isSaving || this.confirmando) return;
    const monto = Math.abs(Number(this.montoControl.value));
    const signo = this.positivo ? '+' : '−';
    this.confirmando = true;

    this.dialogos.confirm(
      'Confirmar ajuste de saldo',
      `¿Aplicar un ajuste de ${signo} ${this.monedaSimbolo} ${monto.toLocaleString('es-PY')} a esta cuenta?`,
      'Un ajuste no tiene contrapartida: queda registrado con tu usuario y el motivo.',
      null, true, 'Sí, ajustar', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      this.confirmando = false;
      if (res !== true) return;
      this.isSaving = true;
      // Mientras se guarda no se cierra (ni Esc ni clic afuera): la lista de cuentas no se releería.
      this.dialogRef.disableClose = true;
      this.cuentaBancariaService
        // El aviso de éxito es propio (más específico); el de error lo da onSaveCustom.
        .onAjustarSaldo(this.data.cuentaBancaria.id, monto, this.positivo, this.motivoControl.value, { avisarExito: false })
        .pipe(untilDestroyed(this))
        .subscribe({
          next: r => {
            this.isSaving = false;
            this.dialogRef.disableClose = false;
            if (r != null) {
              this.notificacion.notification$.next({
                texto: 'Saldo ajustado', color: NotificacionColor.success, duracion: 3,
              });
              this.dialogRef.close(r);
            } else {
              this.sinConfirmar(signo, monto, true);
            }
          },
          error: err => {
            this.isSaving = false;
            this.dialogRef.disableClose = false;
            // Rechazo: no se aplicó nada (el motivo ya lo mostró onSaveCustom); se puede corregir y reintentar.
            if (erroresDeRechazo(err)) return;
            // El corte del link ya avisó que pudo haberse aplicado.
            this.sinConfirmar(signo, monto, !esTimeoutDeLink(err));
          },
        });
    });
  }

  /**
   * El ajuste pudo haberse aplicado, y repetirlo lo aplica otra vez (es relativo: suma o resta el monto) (#390).
   * Se cierra para que la lista de cuentas se relea; el aviso deja el saldo que se veía, para compararlo.
   */
  private sinConfirmar(signo: string, monto: number, avisar: boolean): void {
    if (avisar) {
      const fmt = (n: number) => `${this.monedaSimbolo} ${n.toLocaleString('es-PY')}`.trim();
      this.notificacion.notification$.next({
        texto: `No se pudo confirmar si el ajuste de ${signo} ${fmt(monto)} se aplicó. El saldo que se veía era ${fmt(this.saldoActual)}: comparalo con el de la cuenta y sus movimientos antes de repetirlo.`,
        color: NotificacionColor.warn, duracion: 12,
      });
    }
    this.dialogRef.close(true);
  }

  private err(texto: string): void {
    this.notificacion.notification$.next({ texto, color: NotificacionColor.warn, duracion: 5 });
  }

  cerrar(): void { this.dialogRef.close(null); }
}
