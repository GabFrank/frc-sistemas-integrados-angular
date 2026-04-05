import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { GastoService } from '../../service/gasto.service';
import { PreGastoInput } from '../../models/pre-gasto.model';
import { TipoGasto } from '../../models/tipo-gasto.model';
import { MonedaService } from '../../../moneda/moneda.service';
import { Moneda } from '../../../moneda/moneda.model';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';

export interface SolicitudGastoData {
  enteId?: number;
  descripcion?: string;
  monto?: number;
  sucursalId?: number;
  monedaSimbolo?: string;
  tipoBien?: string;
  bienDescripcion?: string;
  proveedor?: string;
  cuotasTotales?: number;
  cuotasPagadas?: number;
  cuotasFaltantes?: number;
  montoTotal?: number;
  montoYaPagado?: number;
  montoPendiente?: number;
  moneda?: string;
  diaVencimiento?: number;
  diasParaVencer?: number;
  estadoCuota?: string;
  situacionPago?: string;
  sucursalNombre?: string;
  referenciaId?: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-pre-gasto-dialog',
  templateUrl: './adicionar-pre-gasto-dialog.component.html',
  styleUrls: ['./adicionar-pre-gasto-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdicionarPreGastoDialogComponent implements OnInit {
  tipoGastoControl = new FormControl(null, Validators.required);
  descripcionControl = new FormControl(null, Validators.required);
  monedaControl = new FormControl(null, Validators.required);
  montoControl = new FormControl(null, [Validators.required, Validators.min(1)]);
  sucursalControl = new FormControl(null, Validators.required);
  busquedaTipoGastoControl = new FormControl('');
  formaPagoControl = new FormControl('EFECTIVO');
  urgenciaControl = new FormControl('NORMAL');
  observacionesControl = new FormControl('');
  beneficiarioControl = new FormControl('');
  numeroCuotaControl = new FormControl({ value: null, disabled: true });

  listaTipoGasto: TipoGasto[] = [];
  listaMonedas: Moneda[] = [];
  listaSucursales: Sucursal[] = [];
  tipoGastosFiltrados: TipoGasto[] = [];

  tieneDatosBien = false;
  pasoActual = 0;

  formasPago = [
    { valor: 'EFECTIVO', etiqueta: 'Efectivo', icono: 'payments' },
    { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia Bancaria', icono: 'account_balance' },
    { valor: 'CHEQUE', etiqueta: 'Cheque', icono: 'receipt_long' },
    { valor: 'TARJETA', etiqueta: 'Tarjeta', icono: 'credit_card' },
  ];

  nivelesUrgencia = [
    { valor: 'BAJA', etiqueta: 'Baja', color: '#66bb6a' },
    { valor: 'NORMAL', etiqueta: 'Normal', color: '#42a5f5' },
    { valor: 'ALTA', etiqueta: 'Alta', color: '#ffa726' },
    { valor: 'URGENTE', etiqueta: 'Urgente', color: '#ef5350' },
  ];

  constructor(
    private matDialogRef: MatDialogRef<AdicionarPreGastoDialogComponent>,
    private gastoService: GastoService,
    private monedaService: MonedaService,
    private sucursalService: SucursalService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: SolicitudGastoData
  ) {
    this.tieneDatosBien = !!(this.data && this.data.enteId);
    if (this.data) {
      if (this.data.descripcion) {
        this.descripcionControl.setValue(this.data.descripcion);
      }
      if (this.data.monto) {
        this.montoControl.setValue(this.data.monto);
      }
      if (this.data.sucursalId) {
        this.sucursalControl.setValue(this.data.sucursalId);
      }
      if (this.data.cuotasTotales && this.data.cuotasPagadas != null) {
        this.numeroCuotaControl.setValue(this.data.cuotasPagadas + 1);
      }
      if (this.data.proveedor) {
        this.beneficiarioControl.setValue(this.data.proveedor);
      }
    }
  }

  ngOnInit(): void {
    this.gastoService.tipoGastoOnGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.listaTipoGasto = res.filter((tg: TipoGasto) => !tg.isClasificacion && tg.activo);
        this.tipoGastosFiltrados = [...this.listaTipoGasto];

        if (this.tieneDatosBien && this.data.tipoBien) {
          const tipoGastoAutoSeleccion = this.listaTipoGasto.find(
            tg => tg.tipoNaturaleza === this.mapearTipoNaturaleza(this.data.tipoBien)
          );
          if (tipoGastoAutoSeleccion) {
            this.tipoGastoControl.setValue(tipoGastoAutoSeleccion.id);
          }
        }

        this.cdr.markForCheck();
      }
    });

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.listaMonedas = res;

        if (this.data && this.data.monedaSimbolo) {
          const monedaElegida = this.listaMonedas.find(m => m.simbolo === this.data.monedaSimbolo);
          if (monedaElegida) {
            this.monedaControl.setValue(monedaElegida.id);
          }
        }
        this.cdr.markForCheck();
      }
    });

    this.sucursalService.onGetAllSucursales().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.listaSucursales = res;
        this.cdr.markForCheck();
      }
    });

    this.busquedaTipoGastoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(texto => {
      if (texto && texto.length > 0) {
        const busqueda = texto.toUpperCase();
        this.tipoGastosFiltrados = this.listaTipoGasto.filter(
          tg => tg.descripcion.toUpperCase().includes(busqueda)
        );
      } else {
        this.tipoGastosFiltrados = [...this.listaTipoGasto];
      }
      this.cdr.markForCheck();
    });
  }

  formularioValido(): boolean {
    return this.tipoGastoControl.valid
      && this.descripcionControl.valid
      && this.monedaControl.valid
      && this.montoControl.valid
      && this.sucursalControl.valid;
  }

  guardar(): void {
    if (!this.formularioValido()) return;

    const input = new PreGastoInput();
    input.tipoGastoId = this.tipoGastoControl.value;
    input.descripcion = this.construirDescripcionCompleta();
    input.monedaId = this.monedaControl.value;
    input.montoSolicitado = this.montoControl.value;
    input.sucursalCajaId = this.sucursalControl.value;
    if (this.data && this.data.enteId) {
      input.enteId = this.data.enteId;
    }

    this.gastoService.preGastoGuardar(input).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.matDialogRef.close(res);
      }
    });
  }

  cancelar(): void {
    this.matDialogRef.close();
  }

  irAPaso(paso: number): void {
    this.pasoActual = paso;
    this.cdr.markForCheck();
  }

  pasoSiguiente(): void {
    if (this.pasoActual < 2) {
      this.pasoActual++;
      this.cdr.markForCheck();
    }
  }

  pasoAnterior(): void {
    if (this.pasoActual > 0) {
      this.pasoActual--;
      this.cdr.markForCheck();
    }
  }

  porcentajePagado(): number {
    if (!this.data?.montoTotal || this.data.montoTotal <= 0) return 0;
    return Math.min(Math.round(((this.data.montoYaPagado || 0) / this.data.montoTotal) * 100), 100);
  }

  montoPorCuota(): number {
    if (!this.data?.montoTotal || !this.data?.cuotasTotales || this.data.cuotasTotales <= 0) return 0;
    return Math.round(this.data.montoTotal / this.data.cuotasTotales);
  }

  iconoTipoBien(): string {
    const tipo = (this.data?.tipoBien || '').toUpperCase();
    if (tipo === 'MUEBLE') return 'chair';
    if (tipo === 'INMUEBLE') return 'domain';
    if (tipo === 'VEHICULO') return 'directions_car';
    return 'category';
  }

  colorEstadoCuota(): string {
    const estado = this.data?.estadoCuota || '';
    switch (estado) {
      case 'PAGADO': return '#66bb6a';
      case 'AL DIA': return '#42a5f5';
      case 'POR VENCER': return '#ffa726';
      case 'VENCIDO': return '#ef5350';
      default: return '#9e9e9e';
    }
  }

  private construirDescripcionCompleta(): string {
    let desc = this.descripcionControl.value || '';
    const urgencia = this.urgenciaControl.value;
    const formaPago = this.formaPagoControl.value;
    const observaciones = this.observacionesControl.value;
    const beneficiario = this.beneficiarioControl.value;

    const extras: string[] = [];
    if (urgencia && urgencia !== 'NORMAL') {
      extras.push(`[URGENCIA: ${urgencia}]`);
    }
    if (formaPago && formaPago !== 'EFECTIVO') {
      extras.push(`[FORMA PAGO: ${formaPago}]`);
    }
    if (beneficiario) {
      extras.push(`[BENEFICIARIO: ${beneficiario}]`);
    }
    if (observaciones) {
      extras.push(`[OBS: ${observaciones}]`);
    }
    if (extras.length > 0) {
      desc = desc + ' | ' + extras.join(' ');
    }
    return desc;
  }

  private mapearTipoNaturaleza(tipoBien: string): string {
    const tipo = (tipoBien || '').toUpperCase();
    if (tipo === 'MUEBLE') return 'VARIABLE';
    if (tipo === 'INMUEBLE') return 'CONTINUO';
    if (tipo === 'VEHICULO') return 'VARIABLE';
    return '';
  }
}
