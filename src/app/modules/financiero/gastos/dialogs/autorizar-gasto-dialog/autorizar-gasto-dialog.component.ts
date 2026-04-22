import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GastoService } from '../../service/gasto.service';
import { PreGasto } from '../../models/pre-gasto.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../../main.service';

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
  montoRendidoControl = new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] });
  mostrarMotivoRechazo = false;
  readonly ESTADO_TRAMITE = 'TRAMITE';
  resumenMontosPorMoneda: ResumenMontoPorMoneda[] = [];

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
    if (this.estaEnTramite) {
      const montoRetirado = Number(this.preGasto?.montoRetirado ?? 0);
      const montoGastado = Number(this.preGasto?.montoGastado ?? 0);
      const montoInicial = montoGastado > 0 ? montoGastado : montoRetirado;
      this.montoRendidoControl.setValue(montoInicial > 0 ? montoInicial : 0);
      this.montoRendidoControl.addValidators(Validators.max(montoRetirado > 0 ? montoRetirado : Number.MAX_SAFE_INTEGER));
      this.montoRendidoControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  get estaEnTramite(): boolean {
    return this.preGasto?.estado === this.ESTADO_TRAMITE;
  }

  autorizar(): void {
    if (this.estaEnTramite) {
      return;
    }

    const autorizadorId = this.mainService.usuarioActual?.persona?.id || this.preGasto.funcionario?.id;
    if (!autorizadorId) {
      console.error('No se pudo determinar el autorizador');
      return;
    }

    this.gastoService.preGastoAutorizar(this.preGasto.id, autorizadorId, this.preGasto.sucursalId)
      .pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.matDialogRef.close(res);
        }
      });
  }

  rechazar(): void {
    if (this.estaEnTramite) {
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

    this.gastoService.preGastoRechazar(this.preGasto.id, this.motivoRechazoControl.value, this.preGasto.sucursalId)
      .pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.matDialogRef.close(res);
        }
      });
  }

  finalizar(): void {
    if (!this.estaEnTramite) {
      return;
    }
    if (!this.montoRendidoControl.valid) {
      this.montoRendidoControl.markAsTouched();
      return;
    }
    const montoRendido = Number(this.montoRendidoControl.value ?? 0);

    this.gastoService.preGastoCompletar(
      this.preGasto.id,
      this.preGasto.sucursalId,
      montoRendido > 0,
      montoRendido
    )
      .pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.matDialogRef.close(res);
        }
      });
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

  private valorRetiradoPorMoneda(simbolo: string, denominacion: string): number {
    const normalized = (simbolo ?? '').trim().toUpperCase();
    const normalizedDen = (denominacion ?? '').trim().toUpperCase();
    const gasto = this.preGasto?.gasto;
    if (!gasto) {
      return 0;
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
