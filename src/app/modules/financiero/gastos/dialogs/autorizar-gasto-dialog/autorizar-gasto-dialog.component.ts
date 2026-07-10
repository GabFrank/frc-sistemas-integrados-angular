import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GastoService } from '../../service/gasto.service';
import { PreGasto } from '../../models/pre-gasto.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../../main.service';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';

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
  readonly ESTADO_TRAMITE = 'TRAMITE';
  resumenMontosPorMoneda: ResumenMontoPorMoneda[] = [];
  currencyMask = new CurrencyMask();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AutorizarGastoData,
    private matDialogRef: MatDialogRef<AutorizarGastoDialogComponent>,
    private gastoService: GastoService,
    private cdr: ChangeDetectorRef,
    public mainService: MainService
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
          this.preGasto = { ...this.preGasto, ...res };
          this.resumenMontosPorMoneda = this.buildResumenMontosPorMoneda();
          this.devolucionGsControl.setValue(0, { emitEvent: false });
          this.devolucionRsControl.setValue(0, { emitEvent: false });
          this.devolucionDsControl.setValue(0, { emitEvent: false });
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.registrandoDevolucion = false;
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
      .pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.matDialogRef.close(res);
        }
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
      .pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.matDialogRef.close(res);
        }
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
      .pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.matDialogRef.close(res);
        }
      });
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
    this.matDialogRef.close();
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
    const finanzas = this.preGasto?.finanzas ?? [];
    if (finanzas.length === 0) {
      return [{
        etiquetaMoneda: this.preGasto?.moneda?.denominacion ?? 'Moneda',
        simboloMoneda: this.preGasto?.moneda?.simbolo ?? '',
        solicitado: Number(this.preGasto?.montoSolicitado ?? 0),
        retirado: Number(this.preGasto?.montoRetirado ?? 0),
        rendido: Number(this.preGasto?.montoGastado ?? 0),
        vuelto: Number(this.preGasto?.saldoDevolver ?? 0),
      }];
    }

    return finanzas.map((fin) => {
      const simbolo = fin?.moneda?.simbolo ?? '';
      const etiqueta = fin?.moneda?.denominacion ?? 'Moneda';
      const solicitado = Number(fin?.monto ?? 0);
      const retirado = this.valorRetiradoPorMoneda(simbolo, etiqueta);
      const vuelto = this.valorVueltoPorMoneda(simbolo, etiqueta);
      const rendido = Math.max(retirado - vuelto, 0);
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
      const finanzas = this.preGasto?.finanzas ?? [];
      const fin = finanzas.find((item) => {
        const itemSimbolo = (item?.moneda?.simbolo ?? '').trim().toUpperCase();
        const itemDen = (item?.moneda?.denominacion ?? '').trim().toUpperCase();
        return itemSimbolo === normalized || itemDen === normalizedDen;
      });
      return Number(fin?.monto ?? this.preGasto?.montoRetirado ?? 0);
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
