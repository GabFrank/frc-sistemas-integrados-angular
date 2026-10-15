import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GastoService } from '../../service/gasto.service';
import { PreGasto } from '../../models/pre-gasto.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../../main.service';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { avisoTrasMutacion, erroresDeRechazo } from '../../../../../commons/core/utils/graphqlErrorUtils';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';

interface ResumenMontoPorMoneda {
  etiquetaMoneda: string;
  simboloMoneda: string;
  solicitado: number;
  retirado: number;
  rendido: number;
  vuelto: number;
}

export class AutorizarGastoData {
  preGasto: PreGasto;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-autorizar-gasto-dialog',
  templateUrl: './autorizar-gasto-dialog.component.html',
  styleUrls: ['./autorizar-gasto-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutorizarGastoDialogComponent implements OnInit {
  preGasto: PreGasto;
  motivoRechazoControl = new FormControl('');
  montoRendidoGsControl = new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] });
  montoRendidoRsControl = new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] });
  montoRendidoDsControl = new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] });
  devolucionGsControl = new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] });
  devolucionRsControl = new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] });
  devolucionDsControl = new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] });
  mostrarMotivoRechazo = false;
  registrandoDevolucion = false;
  /** Una devolución o un finalizar quedó sin respuesta: repetirlos puede duplicar en el central (#501). */
  devolucionSinConfirmar = false;
  finalizarSinConfirmar = false;
  /** La lista tiene una copia vieja del pre-gasto (devolución registrada o escritura sin respuesta): recarga al cerrar. */
  private recargarListaAlCerrar = false;
  readonly ESTADO_TRAMITE = 'TRAMITE';
  resumenMontosPorMoneda: ResumenMontoPorMoneda[] = [];
  currencyMask = new CurrencyMask();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AutorizarGastoData,
    private matDialogRef: MatDialogRef<AutorizarGastoDialogComponent>,
    private gastoService: GastoService,
    private cdr: ChangeDetectorRef,
    public mainService: MainService,
    private notificacion: NotificacionSnackbarService
  ) {
    this.preGasto = data.preGasto;
  }

  ngOnInit(): void {
    this.resumenMontosPorMoneda = this.buildResumenMontosPorMoneda();
    if (this.esTramite()) {
      this.inicializarMontosRendidos();
    }
  }

  esTramite(): boolean {
    return this.preGasto?.estado === this.ESTADO_TRAMITE;
  }

  tieneSaldoDevolver(): boolean {
    return Number(this.preGasto?.saldoDevolver ?? 0) > 0;
  }

  registrarDevolucion(): void {
    if (!this.esTramite() || !this.tieneSaldoDevolver()) {
      return;
    }
    const vueltoGs = this.parseMontoMoneda(this.devolucionGsControl.value, 'GS');
    const vueltoRs = this.parseMontoMoneda(this.devolucionRsControl.value, 'RS');
    const vueltoDs = this.parseMontoMoneda(this.devolucionDsControl.value, 'DS');
    if (vueltoGs + vueltoRs + vueltoDs <= 0) {
      return;
    }
    this.registrandoDevolucion = true;
    this.gastoService.registrarDevolucionSaldo({
      preGastoId: this.preGasto.id,
      sucursalId: this.preGasto.sucursalId,
      cajaId: this.preGasto.cajaId,
      vueltoGs,
      vueltoRs,
      vueltoDs,
      usuarioId: this.mainService.usuarioActual?.id,
    }).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.registrandoDevolucion = false;
        if (res) {
          this.recargarListaAlCerrar = true;
          this.preGasto = { ...this.preGasto, ...res };
          this.resumenMontosPorMoneda = this.buildResumenMontosPorMoneda();
          this.devolucionGsControl.setValue(0, { emitEvent: false });
          this.devolucionRsControl.setValue(0, { emitEvent: false });
          this.devolucionDsControl.setValue(0, { emitEvent: false });
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.registrandoDevolucion = false;
        // Sin respuesta pudo registrarse, y repetirla resta otra vez el saldo: no se deja repetir con estos datos (#501)
        if (this.avisarSinConfirmar(err, 'se registró la devolución del saldo')) {
          this.devolucionSinConfirmar = true;
          this.devolucionGsControl.setValue(0, { emitEvent: false });
          this.devolucionRsControl.setValue(0, { emitEvent: false });
          this.devolucionDsControl.setValue(0, { emitEvent: false });
        }
        this.cdr.markForCheck();
      },
    });
  }

  autorizar(): void {
    if (this.esTramite()) {
      return;
    }

    const autorizadorId = this.mainService.usuarioActual?.persona?.id || this.preGasto.funcionario?.id;
    if (!autorizadorId) {
      console.error('No se pudo determinar el autorizador');
      return;
    }

    this.gastoService.preGastoAutorizar(
      this.preGasto.id,
      autorizadorId,
      this.mainService.usuarioActual?.id,
      this.preGasto.sucursalId
    )
      .pipe(untilDestroyed(this)).subscribe({
        next: res => {
          if (res != null) {
            this.matDialogRef.close(res);
          }
        },
        error: err => this.avisarSinConfirmar(err, 'se autorizó el gasto'),
      });
  }

  rechazar(): void {
    if (this.esTramite()) {
      return;
    }

    if (!this.mostrarMotivoRechazo) {
      this.mostrarMotivoRechazo = true;
      this.motivoRechazoControl.setValidators(Validators.required);
      this.motivoRechazoControl.updateValueAndValidity();
      this.cdr.markForCheck();
      return;
    }

    if (!this.motivoRechazoControl.valid) return;

    const rechazadorId = this.mainService.usuarioActual?.persona?.id || this.preGasto.funcionario?.id;
    this.gastoService.preGastoRechazar(
      this.preGasto.id,
      this.motivoRechazoControl.value,
      rechazadorId,
      this.mainService.usuarioActual?.id,
      this.preGasto.sucursalId
    )
      .pipe(untilDestroyed(this)).subscribe({
        next: res => {
          if (res != null) {
            this.matDialogRef.close(res);
          }
        },
        error: err => this.avisarSinConfirmar(err, 'se rechazó el gasto'),
      });
  }

  finalizar(): void {
    if (!this.esTramite()) {
      return;
    }
    const montoRendidoGs = this.parseMontoMoneda(this.montoRendidoGsControl.value, 'GS');
    const montoRendidoRs = this.parseMontoMoneda(this.montoRendidoRsControl.value, 'RS');
    const montoRendidoDs = this.parseMontoMoneda(this.montoRendidoDsControl.value, 'DS');
    const montoRendido = montoRendidoGs + montoRendidoRs + montoRendidoDs;

    this.gastoService.preGastoCompletar(
      this.preGasto.id,
      this.preGasto.sucursalId,
      montoRendido > 0,
      montoRendido,
      montoRendidoGs,
      montoRendidoRs,
      montoRendidoDs
    )
      .pipe(untilDestroyed(this)).subscribe({
        next: res => {
          if (res != null) {
            this.matDialogRef.close(res);
          }
        },
        error: err => {
          // Repetir finalizar puede volver a descontar la cuota o crear otro activo: se bloquea (#501)
          if (this.avisarSinConfirmar(err, 'se finalizó el gasto')) {
            this.finalizarSinConfirmar = true;
            this.cdr.markForCheck();
          }
        },
      });
  }

  /**
   * En un rechazo el genérico ya mostró el motivo y no se aplicó nada: devuelve false. Sin respuesta (también en el
   * timeout del link, que ya avisó) pudo haberse aplicado: se avisa si hace falta y devuelve true (#501).
   */
  private avisarSinConfirmar(err: any, queSeHizo: string): boolean {
    if (erroresDeRechazo(err) != null) return false;
    this.recargarListaAlCerrar = true;
    const aviso = avisoTrasMutacion(err, queSeHizo);
    if (aviso != null) this.notificacion.openWarn(`${aviso} Cerrá el diálogo: la lista se actualiza.`, 10);
    return true;
  }

  private parseMontoMoneda(value: unknown, moneda: 'GS' | 'RS' | 'DS'): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) && value > 0 ? value : 0;
    }
    if (value == null) {
      return 0;
    }
    const text = String(value).trim();
    if (text.length === 0) {
      return 0;
    }
    if (moneda === 'GS') {
      const numeric = text.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.-]/g, '');
      const parsed = Number(numeric);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    const numeric = text.replace(/,/g, '').replace(/[^\d.-]/g, '');
    const parsed = Number(numeric);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  cancelar(): void {
    // La lista recarga y suelta la copia vieja del pre-gasto: reabrir mostraba el saldo de antes (#501)
    this.matDialogRef.close(this.recargarListaAlCerrar ? { recargar: true } : undefined);
  }

  formatMonto(value: number | null | undefined): string {
    const monto = Number(value ?? 0);
    return monto.toLocaleString('es-PY', {
      minimumFractionDigits: monto % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  limpiarDescripcion(descripcion: string | undefined | null): string {
    if (!descripcion) return '';
    return descripcion.replace(/\s*\|\s*\[URGENCIA:.*?\]/i, '').trim();
  }

  private buildResumenMontosPorMoneda(): ResumenMontoPorMoneda[] {
    const isPendingOrAuthorized = this.preGasto?.estado === 'PENDIENTE' || this.preGasto?.estado === 'AUTORIZADO';
    const finanzas = this.preGasto?.finanzas ?? [];
    if (finanzas.length === 0) {
      return [{
        etiquetaMoneda: this.preGasto?.moneda?.denominacion ?? 'Moneda',
        simboloMoneda: this.preGasto?.moneda?.simbolo ?? '',
        solicitado: Number(this.preGasto?.montoSolicitado ?? 0),
        retirado: isPendingOrAuthorized ? 0 : Number(this.preGasto?.montoRetirado ?? 0),
        rendido: isPendingOrAuthorized ? 0 : Number(this.preGasto?.montoGastado ?? 0),
        vuelto: isPendingOrAuthorized ? 0 : Number(this.preGasto?.saldoDevolver ?? 0),
      }];
    }

    return finanzas.map((fin) => {
      const simbolo = fin?.moneda?.simbolo ?? '';
      const etiqueta = fin?.moneda?.denominacion ?? 'Moneda';
      const solicitado = Number(fin?.monto ?? 0);
      const retirado = isPendingOrAuthorized ? 0 : this.valorRetiradoPorMoneda(simbolo, etiqueta);
      const vuelto = isPendingOrAuthorized ? 0 : this.valorVueltoPorMoneda(simbolo, etiqueta);
      const rendido = isPendingOrAuthorized ? 0 : Math.max(retirado - vuelto, 0);
      return {
        etiquetaMoneda: etiqueta,
        simboloMoneda: simbolo,
        solicitado,
        retirado,
        rendido,
        vuelto,
      };
    });
  }

  private inicializarMontosRendidos(): void {
    const gasto = this.preGasto?.gasto;
    const retiroGs = Number(gasto?.retiroGs ?? 0);
    const retiroRs = Number(gasto?.retiroRs ?? 0);
    const retiroDs = Number(gasto?.retiroDs ?? 0);
    const vueltoGs = Number(gasto?.vueltoGs ?? 0);
    const vueltoRs = Number(gasto?.vueltoRs ?? 0);
    const vueltoDs = Number(gasto?.vueltoDs ?? 0);

    this.montoRendidoGsControl.setValue(Math.max(retiroGs - vueltoGs, 0), { emitEvent: false });
    this.montoRendidoRsControl.setValue(Math.max(retiroRs - vueltoRs, 0), { emitEvent: false });
    this.montoRendidoDsControl.setValue(Math.max(retiroDs - vueltoDs, 0), { emitEvent: false });

    this.montoRendidoGsControl.updateValueAndValidity({ emitEvent: false });
    this.montoRendidoRsControl.updateValueAndValidity({ emitEvent: false });
    this.montoRendidoDsControl.updateValueAndValidity({ emitEvent: false });
  }

  private valorRetiradoPorMoneda(simbolo: string, denominacion: string): number {
    const normalized = (simbolo ?? '').trim().toUpperCase();
    const normalizedDen = (denominacion ?? '').trim().toUpperCase();
    const gasto = this.preGasto?.gasto;
    if (!gasto) {
      if (this.preGasto?.estado === 'PENDIENTE' || this.preGasto?.estado === 'AUTORIZADO') {
        return 0;
      }
      return Number(this.preGasto?.montoRetirado ?? 0);
    }
    if (normalized.includes('GS') || normalizedDen.includes('GUARANI')) {
      return Number(gasto.retiroGs ?? 0);
    }
    if (normalized.includes('R$') || normalized.includes('RS') || normalizedDen.includes('REAL')) {
      return Number(gasto.retiroRs ?? 0);
    }
    if (normalized.includes('USD') || normalized.includes('US$') || normalized === '$' || normalizedDen.includes('DOLAR')) {
      return Number(gasto.retiroDs ?? 0);
    }
    return 0;
  }

  private valorVueltoPorMoneda(simbolo: string, denominacion: string): number {
    const normalized = (simbolo ?? '').trim().toUpperCase();
    const normalizedDen = (denominacion ?? '').trim().toUpperCase();
    const gasto = this.preGasto?.gasto;
    if (!gasto) {
      return 0;
    }
    if (normalized.includes('GS') || normalizedDen.includes('GUARANI')) {
      return Number(gasto.vueltoGs ?? 0);
    }
    if (normalized.includes('R$') || normalized.includes('RS') || normalizedDen.includes('REAL')) {
      return Number(gasto.vueltoRs ?? 0);
    }
    if (normalized.includes('USD') || normalized.includes('US$') || normalized === '$' || normalizedDen.includes('DOLAR')) {
      return Number(gasto.vueltoDs ?? 0);
    }
    return 0;
  }
}
