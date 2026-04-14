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
import { MatDialog } from '@angular/material/dialog';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { UsuariosSearchPaginatedGQL } from '../../../../personas/usuarios/graphql/usuarioSearchPaginated';
import { EnteService } from '../../../../activos/ente/service/ente.service';
import { TipoEnte } from '../../../../activos/ente/enums/tipo-ente.enum';

import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { EnteFinancialSummaryGQL } from '../../graphql/getEnteFinancialSummary';
import { take } from 'rxjs/operators';
import { Ente } from '../../../../activos/ente/models/ente.model';

export interface SolicitudGastoData {
  enteId?: number;
  descripcion?: string;
  monto?: number;
  sucursalId?: number;
  monedaSimbolo?: string;
  monedaId?: number;
  tipoBien?: string;
  bienDescripcion?: string;
  proveedor?: string;
  proveedorNombre?: string;
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
  tipoGastoId?: number;
  tipoGastoSugeridoId?: string;
  porcentajePagado?: number;
  montoSugerido?: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-pre-gasto-dialog',
  templateUrl: './adicionar-pre-gasto-dialog.component.html',
  styleUrls: ['./adicionar-pre-gasto-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdicionarPreGastoDialogComponent implements OnInit {
  currencyMask = new CurrencyMask();
  selectedCurrencyOptions = this.currencyMask.currencyOptionsGuarani;
  precisionDisplay = '1.0-0';
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
  solicitanteControl = new FormControl(null);
  numeroCuotaControl = new FormControl({ value: null, disabled: true });
  tipoBienControl = new FormControl(null);
  tiposEnte = [TipoEnte.VEHICULO, TipoEnte.INMUEBLE, TipoEnte.MUEBLE];

  listaTipoGasto: TipoGasto[] = [];
  listaMonedas: Moneda[] = [];
  listaSucursales: Sucursal[] = [];
  tipoGastosFiltrados: TipoGasto[] = [];
  enteSeleccionado: Ente | null = null;
  bienSeleccionadoDescripcion: string | null = null;
  cargandoBien = false;

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
    private matDialog: MatDialog,
    private usuariosSearchPaginatedGQL: UsuariosSearchPaginatedGQL,
    private enteService: EnteService,
    private enteFinancialSummaryGQL: EnteFinancialSummaryGQL,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: SolicitudGastoData
  ) {
    this.tieneDatosBien = !!(this.data && this.data.enteId);
    if (!this.tieneDatosBien) {
      this.pasoActual = 1;
    }
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
        this.autoSeleccionarTipoGasto();
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
        this.actualizarCurrencyOptions();
        this.cdr.markForCheck();
      }
    });

    this.monedaControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.actualizarCurrencyOptions();
      this.cdr.markForCheck();
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

    if (this.data?.enteId) {
      this.cargarSummaryBackend(this.data.enteId);
    }
  }

  private autoSeleccionarTipoGasto(): void {
    if (this.data?.tipoGastoSugeridoId && this.listaTipoGasto.length > 0) {
      const match = this.listaTipoGasto.find(tg => tg.tipoNaturaleza === this.data.tipoGastoSugeridoId);
      if (match) this.tipoGastoControl.setValue(match.id);
    }
  }

  private cargarSummaryBackend(enteId: number): void {
    this.cargandoBien = true;
    this.cdr.markForCheck();
    this.enteFinancialSummaryGQL.fetch({ enteId }, { fetchPolicy: 'no-cache' }).pipe(take(1)).subscribe(res => {
      this.cargandoBien = false;
      const summary = res.data?.data;
      if (summary) {
        if (!this.data) this.data = {};
        Object.assign(this.data, summary);
        this.bienSeleccionadoDescripcion = summary.descripcion;
        this.beneficiarioControl.setValue(summary.proveedorNombre || '');
        if (summary.monedaId) this.monedaControl.setValue(summary.monedaId);
        if (summary.cuotasPagadas != null) this.numeroCuotaControl.setValue(summary.cuotasPagadas + 1);

        // Auto-rellenar monto con cuota
        if (summary.cuotasTotales > 0 && summary.montoTotal > 0) {
          const montoCuota = Math.round(summary.montoTotal / summary.cuotasTotales);
          if (!this.montoControl.value) this.montoControl.setValue(montoCuota);
        }

        // Auto-rellenar descripción
        if (!this.descripcionControl.value) {
          this.descripcionControl.setValue(`Pago de Activo - ${summary.descripcion}`);
        }

        this.autoSeleccionarTipoGasto();
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
    input.descripcion = this.descripcionControl.value;
    input.monedaId = this.monedaControl.value;
    input.montoSolicitado = this.montoControl.value;
    input.sucursalCajaId = this.sucursalControl.value;
    input.enteId = this.data?.enteId || this.enteSeleccionado?.id;
    input.funcionarioId = this.solicitanteControl.value?.persona?.id;

    input.nivelUrgencia = this.urgenciaControl.value;
    if (this.montoControl.value > 0) {
      input.finanzas = [{
        formaPago: this.formaPagoControl.value,
        monto: this.montoControl.value,
        monedaId: this.monedaControl.value
      }];
    } else {
      input.finanzas = [];
    }

    if (this.beneficiarioControl.value) {
      input.observaciones = (this.observacionesControl.value || '') + '\nBeneficiario: ' + this.beneficiarioControl.value;
    } else {
      input.observaciones = this.observacionesControl.value;
    }

    this.gastoService.preGastoGuardar(input).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.matDialogRef.close(res);
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
    return this.data?.porcentajePagado || 0;
  }

  montoPorCuota(): number {
    return this.data?.montoSugerido || 0;
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

  abrirBuscadorSolicitante(): void {
    const data = new SearchListtDialogData();
    data.titulo = 'Seleccionar Solicitante';
    data.query = this.usuariosSearchPaginatedGQL;
    data.paginator = true;
    data.searchFieldName = 'texto';
    data.tableData = [
      { id: 'id', nombre: 'ID', width: '50px' },
      { id: 'persona.nombre', nombre: 'Nombre', width: 'auto' },
      { id: 'nickname', nombre: 'Usuario', width: '100px' },
    ];
    this.matDialog.open(SearchListDialogComponent, {
      data: data,
      width: '80%',
      height: '80%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.solicitanteControl.setValue(res);
        this.cdr.markForCheck();
      }
    });
  }

  abrirBuscadorBien(tipoStr: string): void {
    this.enteService.abrirBuscadorEnte(tipoStr as TipoEnte).pipe(untilDestroyed(this)).subscribe(ente => {
      if (ente) {
        this.enteSeleccionado = ente;
        this.tieneDatosBien = true;
        this.cargarSummaryBackend(ente.id);
        this.pasoActual = 0;
        this.cdr.markForCheck();
      }
    });
  }

  /** Buscador genérico de bienes (todos los tipos) - replica lógica de bienes por sucursal */
  abrirBuscadorBienGenerico(): void {
    if (this.tipoBienControl.value) {
      this.abrirBuscadorBien(this.tipoBienControl.value);
    }
  }

  limpiarBienSeleccionado(): void {
    this.enteSeleccionado = null;
    this.bienSeleccionadoDescripcion = null;
    this.tieneDatosBien = false;
    this.beneficiarioControl.setValue('');
    if (!this.data) this.data = {};
    this.data.enteId = undefined;
    this.data.tipoBien = undefined;
    this.data.bienDescripcion = undefined;
    this.data.proveedor = undefined;
    this.cdr.markForCheck();
  }


  private mapearEnteASolicitudData(ente: Ente, tipoStr: string): void {
    if (!this.data) this.data = {};
    this.data.enteId = ente.id;
    this.data.tipoBien = tipoStr;
    const label = tipoStr.charAt(0) + tipoStr.slice(1).toLowerCase();
    this.data.bienDescripcion = `${label} #${ente.id}`;
    this.data.referenciaId = ente.referenciaId;
    this.pasoActual = 0;
  }

  actualizarCurrencyOptions(): void {
    const monedaId = this.monedaControl.value;
    const moneda = this.listaMonedas.find(m => m.id === monedaId);
    if (moneda?.simbolo === 'Gs' || moneda?.simbolo === 'Gs.') {
      this.selectedCurrencyOptions = this.currencyMask.currencyOptionsGuarani;
      this.precisionDisplay = '1.0-0';
    } else {
      this.selectedCurrencyOptions = this.currencyMask.currencyOptionsNoGuarani;
      this.precisionDisplay = '1.0-2';
    }
  }
}
