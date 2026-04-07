import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GastoService } from '../../service/gasto.service';
import { PreGastoInput } from '../../models/pre-gasto.model';
import { TipoGasto } from '../../models/tipo-gasto.model';
import { MonedaService } from '../../../moneda/moneda.service';
import { Moneda } from '../../../moneda/moneda.model';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatDialog } from '@angular/material/dialog';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { UsuariosSearchPaginatedGQL } from '../../../../personas/usuarios/graphql/usuarioSearchPaginated';
import { EnteService } from '../../../../activos/ente/service/ente.service';
import { TipoEnte } from '../../../../activos/ente/enums/tipo-ente.enum';
import { Ente } from '../../../../activos/ente/models/ente.model';
import { of, Observable } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { MuebleService } from '../../../../activos/muebles/service/mueble.service';
import { InmuebleService } from '../../../../activos/inmueble/service/inmueble.service';
import { VehiculoService } from '../../../../activos/vehiculos/vehiculo/service/vehiculo.service';
import { EnteSearchPageGQL } from '../../../../activos/ente/graphql/enteSearchPage';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { BienesDashboardComponent } from '../../../../activos/dashboard/bienes-dashboard/bienes-dashboard.component';
import { Tab } from '../../../../../layouts/tab/tab.model';

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
  tipoGastoId?: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-pre-gasto',
  templateUrl: './adicionar-pre-gasto.component.html',
  styleUrls: ['./adicionar-pre-gasto.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdicionarPreGastoComponent implements OnInit {
  private gastoService = inject(GastoService);
  private monedaService = inject(MonedaService);
  private sucursalService = inject(SucursalService);
  private matDialog = inject(MatDialog);
  private usuariosSearchPaginatedGQL = inject(UsuariosSearchPaginatedGQL);
  private enteService = inject(EnteService);
  private muebleService = inject(MuebleService);
  private inmuebleService = inject(InmuebleService);
  private vehiculoService = inject(VehiculoService);
  private enteSearchPageGQL = inject(EnteSearchPageGQL);
  private cdr = inject(ChangeDetectorRef);
  private tabService = inject(TabService);

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
  data: SolicitudGastoData = {};

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

  ngOnInit(): void {
    // Intentar recuperar data del tab actual si existe
    const tabData = this.tabService.currentTab()?.tabData?.data;
    if (tabData) {
      this.data = tabData;
      this.tieneDatosBien = !!(this.data && this.data.enteId);
      if (!this.tieneDatosBien) {
        this.pasoActual = 1;
      }
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
    } else {
        this.pasoActual = 1;
    }

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
        } else if (this.data && this.data.tipoGastoId) {
          const matchedTipo = this.listaTipoGasto.find(tg => tg.id === this.data.tipoGastoId);
          if (matchedTipo) {
            this.tipoGastoControl.setValue(matchedTipo.id);
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
  }

  guardado = false;

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
    } else if (this.enteSeleccionado) {
      input.enteId = this.enteSeleccionado.id;
    }
    if (this.solicitanteControl.value) {
      input.funcionarioId = this.solicitanteControl.value.persona?.id;
    }

    this.gastoService.preGastoGuardar(input).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.guardado = true;
        this.cdr.markForCheck();
      }
    });
  }

  cancelar(): void {
    this.tabService.removeTab(this.tabService.currentIndex);
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

  abrirBuscadorBien(tipoStr: string): void {
    const tipo = (tipoStr as TipoEnte);
    this.enteService.abrirBuscadorEnte(tipo).pipe(untilDestroyed(this)).subscribe(ente => {
      if (ente) {
        this.enteSeleccionado = ente;
        this.tieneDatosBien = true;
        this.mapearEnteASolicitudData(ente, tipoStr);
        this.cargarDetalleBienYBeneficiario(ente);
        this.cdr.markForCheck();
      }
    });
  }

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

  private cargarDetalleBienYBeneficiario(ente: Ente): void {
    if (!ente?.referenciaId || !ente?.tipoEnte) return;
    this.cargandoBien = true;
    this.cdr.markForCheck();

    this.obtenerDetalleBien(ente).pipe(untilDestroyed(this)).subscribe(detalle => {
      this.cargandoBien = false;
      if (detalle) {
        const descripcionBien = this.resolverDescripcionBien(ente, detalle);
        this.bienSeleccionadoDescripcion = descripcionBien;
        if (!this.data) this.data = {};
        this.data.bienDescripcion = descripcionBien;

        const proveedor = detalle?.proveedor?.nombre || '';
        if (proveedor) {
          this.beneficiarioControl.setValue(proveedor);
          this.data.proveedor = proveedor;
        }

        if (detalle.montoTotal != null) this.data.montoTotal = Number(detalle.montoTotal) || 0;
        if (detalle.montoYaPagado != null) this.data.montoYaPagado = Number(detalle.montoYaPagado) || 0;
        if (detalle.montoTotal != null && detalle.montoYaPagado != null) {
          this.data.montoPendiente = Math.max((Number(detalle.montoTotal) || 0) - (Number(detalle.montoYaPagado) || 0), 0);
        }
        if (detalle.cantidadCuotas != null) this.data.cuotasTotales = Number(detalle.cantidadCuotas) || 0;
        if (detalle.cantidadCuotasPagadas != null) this.data.cuotasPagadas = Number(detalle.cantidadCuotasPagadas) || 0;
        if (this.data.cuotasTotales != null && this.data.cuotasPagadas != null) {
          this.data.cuotasFaltantes = Math.max(this.data.cuotasTotales - this.data.cuotasPagadas, 0);
        }
        if (detalle.diaVencimiento != null) this.data.diaVencimiento = Number(detalle.diaVencimiento) || 0;
        if (detalle.moneda?.simbolo) {
          this.data.moneda = detalle.moneda.simbolo;
          this.data.monedaSimbolo = detalle.moneda.simbolo;
          const monedaMatch = this.listaMonedas.find(m => m.simbolo === detalle.moneda.simbolo);
          if (monedaMatch) this.monedaControl.setValue(monedaMatch.id);
        }
        if (detalle.situacionPago) this.data.situacionPago = detalle.situacionPago;

        const cuotasTotales = Number(detalle.cantidadCuotas) || 0;
        const montoTotal = Number(detalle.montoTotal) || 0;
        if (cuotasTotales > 0 && montoTotal > 0) {
          const montoCuota = Math.round(montoTotal / cuotasTotales);
          if (!this.montoControl.value) {
            this.montoControl.setValue(montoCuota);
          }
        }

        const tipoLabel = (ente.tipoEnte || '').charAt(0) + (ente.tipoEnte || '').slice(1).toLowerCase();
        if (!this.descripcionControl.value) {
          this.descripcionControl.setValue(`Pago de ${tipoLabel} - ${descripcionBien}`);
        }
      }
      this.cdr.markForCheck();
    });
  }

  private obtenerDetalleBien(ente: Ente): Observable<any> {
    if (!ente?.referenciaId || !ente?.tipoEnte) return of({});
    switch (ente.tipoEnte) {
      case TipoEnte.MUEBLE:
        return this.muebleService.onBuscarPorId(ente.referenciaId).pipe(catchError(() => of({})));
      case TipoEnte.INMUEBLE:
        return this.inmuebleService.onBuscarPorId(ente.referenciaId).pipe(catchError(() => of({})));
      case TipoEnte.VEHICULO:
        return this.vehiculoService.onBuscarPorId(ente.referenciaId).pipe(catchError(() => of({})));
      default:
        return of({});
    }
  }

  private resolverDescripcionBien(ente: Ente, detalle: any): string {
    if (ente?.tipoEnte === TipoEnte.MUEBLE) {
      return detalle?.descripcion || detalle?.identificador || `Mueble #${ente?.referenciaId || ''}`;
    }
    if (ente?.tipoEnte === TipoEnte.INMUEBLE) {
      return detalle?.nombreAsignado || detalle?.direccion || `Inmueble #${ente?.referenciaId || ''}`;
    }
    if (ente?.tipoEnte === TipoEnte.VEHICULO) {
      return detalle?.chapa || detalle?.modelo?.descripcion || `Vehículo #${ente?.referenciaId || ''}`;
    }
    return `Bien #${ente?.referenciaId || ''}`;
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
