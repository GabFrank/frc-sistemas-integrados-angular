import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CuentaBancaria } from '../cuenta-bancaria.model';
import { CuentaBancariaService, PedidoDeAjusteBancario } from '../cuenta-bancaria.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';
import { nuevaClaveIdempotencia } from '../../../../commons/core/utils/claveIdempotencia';
import { esRechazoPorSaldo } from '../../rechazo-por-saldo';

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

  /** El ajuste que quedó sin respuesta. Mientras exista solo se puede reenviarlo o cerrar. */
  private pedidoPendiente: PedidoDeAjusteBancario | null = null;
  /** Espejos de `pedidoPendiente` para el template (campos, no getters). */
  hayPendiente = false;
  pendienteDescripcion = '';

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
    if (this.hayPendiente) return;
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
      // Una clave por cada «Aplicar». El pedido se guarda entero, con ella y con el saldo que se veía, para
      // poder reenviarlo idéntico (franco-system-backend-servidor#376).
      this.pendienteDescripcion = `${signo} ${this.monedaSimbolo} ${monto.toLocaleString('es-PY')}`.trim();
      this.enviar({
        cuentaBancariaId: this.data.cuentaBancaria.id,
        monto,
        positivo: this.positivo,
        motivo: this.motivoControl.value,
        saldoEsperado: this.saldoActual,
        claveIdempotencia: nuevaClaveIdempotencia(),
      }, false);
    });
  }

  /**
   * Reenvía el ajuste que quedó sin respuesta, idéntico y con su misma clave: si el central ya lo había aplicado
   * devuelve ese ajuste, y si no, lo aplica ahora. Nunca dos.
   */
  reenviar(): void {
    if (!this.pedidoPendiente || this.isSaving) return;
    this.enviar(this.pedidoPendiente, true);
  }

  private enviar(pedido: PedidoDeAjusteBancario, esReenvio: boolean): void {
    this.isSaving = true;
    // Mientras se guarda no se cierra (ni Esc ni clic afuera): la lista de cuentas no se releería.
    this.dialogRef.disableClose = true;
    // El aviso de éxito es propio (más específico); el de error lo da onSaveCustom.
    this.cuentaBancariaService.onAjustarSaldo(pedido, { avisarExito: false }).pipe(untilDestroyed(this)).subscribe({
      next: r => {
        this.isSaving = false;
        if (r == null) { this.quedoSinConfirmar(pedido, true); return; }
        this.dialogRef.disableClose = false;
        this.notificacion.notification$.next({ texto: 'Saldo ajustado', color: NotificacionColor.success, duracion: 3 });
        this.dialogRef.close(r);
      },
      error: err => {
        this.isSaving = false;
        const rechazo = erroresDeRechazo(err);
        if (rechazo) {
          // No se aplicó nada (el motivo ya lo mostró onSaveCustom).
          this.pedidoPendiente = null;
          this.hayPendiente = false;
          this.dialogRef.disableClose = false;
          // Si la cuenta ya no tiene el saldo que se veía, este diálogo quedó viejo y cualquier otro intento
          // volvería a rechazarse: se cierra para que la lista se relea. Los demás rechazos dejan corregir.
          if (esRechazoPorSaldo(rechazo)) this.dialogRef.close(true);
          return;
        }
        // El corte del link ya avisó que pudo haberse aplicado.
        this.quedoSinConfirmar(pedido, !esTimeoutDeLink(err) || esReenvio);
      },
    });
  }

  /**
   * El ajuste pudo haberse aplicado. El diálogo queda abierto solo para reenviarlo (seguro, por la clave) o
   * cerrar: no se vuelve al formulario, porque un pedido nuevo saldría con otra clave. `disableClose` sigue en
   * true: Esc y el clic afuera cerrarían sin que la lista de cuentas se relea.
   */
  private quedoSinConfirmar(pedido: PedidoDeAjusteBancario, avisar: boolean): void {
    this.pedidoPendiente = pedido;
    this.hayPendiente = true;
    if (avisar) {
      this.notificacion.notification$.next({
        texto: 'No se pudo confirmar si el ajuste se aplicó: podés reintentar sin riesgo de aplicarlo dos veces.',
        color: NotificacionColor.warn, duracion: 8,
      });
    }
  }

  /** Cierra con el ajuste sin confirmar. Cierra con `true` para que la lista de cuentas se relea. */
  cerrarSinConfirmar(): void {
    if (this.isSaving) return;
    this.notificacion.notification$.next({
      texto: `No se pudo confirmar si el ajuste de ${this.pendienteDescripcion} se aplicó: revisá el saldo y los movimientos de la cuenta antes de repetirlo.`,
      color: NotificacionColor.warn, duracion: 12,
    });
    this.dialogRef.close(true);
  }

  private err(texto: string): void {
    this.notificacion.notification$.next({ texto, color: NotificacionColor.warn, duracion: 5 });
  }

  cerrar(): void { this.dialogRef.close(null); }
}
