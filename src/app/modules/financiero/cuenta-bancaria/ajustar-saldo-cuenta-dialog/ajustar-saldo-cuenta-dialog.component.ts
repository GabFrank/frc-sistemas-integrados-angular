import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CuentaBancaria } from '../cuenta-bancaria.model';
import { CuentaBancariaService } from '../cuenta-bancaria.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';

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

    const monto = Math.abs(Number(this.montoControl.value));
    const signo = this.positivo ? '+' : '−';

    this.dialogos.confirm(
      'Confirmar ajuste de saldo',
      `¿Aplicar un ajuste de ${signo} ${this.monedaSimbolo} ${monto.toLocaleString('es-PY')} a esta cuenta?`,
      'Un ajuste no tiene contrapartida: queda registrado con tu usuario y el motivo.',
      null, true, 'Sí, ajustar', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res !== true) return;
      this.isSaving = true;
      this.cuentaBancariaService
        .onAjustarSaldo(this.data.cuentaBancaria.id, monto, this.positivo, this.motivoControl.value)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: r => {
            this.isSaving = false;
            if (r != null) {
              this.notificacion.notification$.next({
                texto: 'Saldo ajustado', color: NotificacionColor.success, duracion: 3,
              });
              this.dialogRef.close(r);
            }
          },
          error: e => {
            this.isSaving = false;
            this.err(e?.graphQLErrors?.[0]?.message || e?.message || 'No se pudo ajustar el saldo');
          },
        });
    });
  }

  private err(texto: string): void {
    this.notificacion.notification$.next({ texto, color: NotificacionColor.warn, duracion: 5 });
  }

  cerrar(): void { this.dialogRef.close(null); }
}
