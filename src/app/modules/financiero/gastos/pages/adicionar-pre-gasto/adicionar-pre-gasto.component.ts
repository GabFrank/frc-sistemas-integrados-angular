import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { FormControl, Validators } from '@angular/forms';
import { GastoService } from '../../service/gasto.service';
import { PreGasto, PreGastoInput } from '../../models/pre-gasto.model';
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
import { EnteFinancialSummaryGQL } from '../../graphql/getEnteFinancialSummary';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { ReporteService } from '../../../../reportes/reporte.service';
import { ReportesComponent } from '../../../../reportes/reportes/reportes.component';
import { ListPreGastosComponent } from '../list-pre-gastos/list-pre-gastos.component';
import { SolicitudGastoData } from '../../models/solicitud-gasto-data.model';
import { PreGastoDetalleFinanzasInput } from '../../models/pre-gasto.model';
import { PersonaSearchPageGQL } from '../../../../personas/persona/graphql/personaSearchPage';
import { ProveedoresSearchByPersonaPageGQL } from '../../../../personas/proveedor/graphql/proveedorSearchByPersonaPage';
import { CurrencyMaskInputMode } from 'ngx-currency';


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
  private cdr = inject(ChangeDetectorRef);
  private tabService = inject(TabService);
  private reporteService = inject(ReporteService);
  private enteFinancialSummaryGQL = inject(EnteFinancialSummaryGQL);
  private personaSearchPageGQL = inject(PersonaSearchPageGQL);
  private proveedorSearchByPersonaPageGQL = inject(ProveedoresSearchByPersonaPageGQL);

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
  beneficiarioPersonaControl = new FormControl(null);
  beneficiarioProveedorControl = new FormControl(null);
  fechaVencimientoControl = new FormControl(null);
  listaFinanzas: PreGastoDetalleFinanzasInput[] = [];
  finanzaDuplicadaMsg: string | null = null;
  finanzaMonedaControl = new FormControl(null);
  finanzaFormaPagoControl = new FormControl('EFECTIVO');
  finanzaMontoControl = new FormControl(null);
  selectedFinanzaCurrencyOptions = this.currencyMask.currencyOptionsGuarani;
  solicitanteControl = new FormControl(null);
  numeroCuotaControl = new FormControl({ value: null, disabled: true });
  tipoBienControl = new FormControl(null);
  motivoGastoControl = new FormControl('CUOTA');
  lastResumen: any = null;
  tiposEnte = [TipoEnte.VEHICULO, TipoEnte.INMUEBLE, TipoEnte.MUEBLE];

  displayedColumns: string[] = ['ref', 'descripcion', 'acciones'];
  ultimasSolicitudes: PreGasto[] = [];

  totalElementos = 0;
  paginaActual = 0;
  tamanoPagina = 15;

  listaMotivos = [
    { valor: 'CUOTA', etiqueta: 'Pago de Cuota / Deuda', icono: 'event_note' },
    { valor: 'MANTENIMIENTO', etiqueta: 'Mantenimiento / Reparación', icono: 'build' },
    { valor: 'REPUESTO', etiqueta: 'Compra de Repuesto', icono: 'settings' },
    { valor: 'IMPUESTO', etiqueta: 'Impuesto / Tasa', icono: 'account_balance' },
    { valor: 'OTRO', etiqueta: 'Otro Gasto del Activo', icono: 'more_horiz' },
  ];

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
  idPreGastoGuardado: number | null = null;
  sucursalIdPreGastoGuardado: number | null = null;
  diasParaVencer: number | null = null;
  notificacionVencimiento: string | null = null;

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

  private finanzaCurrencyOptionsNoGuarani = {
    allowNegative: true,
    precision: 2,
    thousands: '.',
    nullable: false,
    inputMode: CurrencyMaskInputMode.FINANCIAL,
    align: 'right',
    allowZero: true,
    decimal: ',',
    prefix: '',
    suffix: '',
    max: null,
    min: null,
  };

  ngOnInit(): void {
    const tabData = this.tabService.currentTab()?.tabData?.data;
    if (tabData) {
      this.data = tabData;
      this.tieneDatosBien = !!(this.data && this.data.enteId);
      this.pasoActual = 0;
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
      }
    } else {
      this.pasoActual = 0;
    }

    this.cargarUltimasSolicitudes();

    this.gastoService.tipoGastoOnGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.listaTipoGasto = res.filter((tg: TipoGasto) => !tg.isClasificacion && tg.activo);
        this.tipoGastosFiltrados = [...this.listaTipoGasto];

        if (this.data && this.data.tipoGastoId) {
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
        this.actualizarFinanzaCurrencyOptions();
        this.cdr.markForCheck();
      }
    });

    this.monedaControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.actualizarCurrencyOptions();
      this.cdr.markForCheck();
    });

    this.finanzaMonedaControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.actualizarFinanzaCurrencyOptions();
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

    this.motivoGastoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(motivo => {
      this.actualizarCamposPorMotivo(motivo);
    });
  }

  guardado = false;

  formularioValido(): boolean {
    const isValid = this.tipoGastoControl.valid
      && this.descripcionControl.valid
      && this.sucursalControl.valid
      && this.listaFinanzas.length > 0;

    if (!isValid) return false;

    if (this.motivoGastoControl.value === 'CUOTA' && this.data?.montoPendiente !== undefined && this.data.montoPendiente !== null) {
      const montoTotal = this.listaFinanzas.reduce((sum, f) => sum + (f.monto || 0), 0);
      if (montoTotal > this.data.montoPendiente) {
        return false;
      }
    }

    return true;
  }

  guardar(): void {
    if (!this.formularioValido()) return;

    const input = new PreGastoInput();
    input.tipoGastoId = this.tipoGastoControl.value;
    input.descripcion = this.descripcionControl.value;
    // monedaId y montoSolicitado se calculan en el backend desde finanzas
    input.sucursalCajaId = this.sucursalControl.value;
    if (this.data && this.data.enteId) {
      input.enteId = this.data.enteId;
    } else if (this.enteSeleccionado) {
      input.enteId = this.enteSeleccionado.id;
    }
    if (this.solicitanteControl.value) {
      input.funcionarioId = this.solicitanteControl.value.persona?.id;
    }

    input.nivelUrgencia = this.urgenciaControl.value;
    input.observaciones = this.observacionesControl.value;

    const beneficiarioPersona = this.beneficiarioPersonaControl.value;
    const beneficiarioProveedor = this.beneficiarioProveedorControl.value;
    if (beneficiarioPersona && beneficiarioProveedor) {
      // Protección adicional en UI: backend también valida.
      return;
    }
    if (beneficiarioPersona) {
      input.beneficiarioPersonaId = beneficiarioPersona.id;
      input.beneficiarioProveedorId = null;
    } else if (beneficiarioProveedor) {
      input.beneficiarioProveedorId = beneficiarioProveedor.id;
      input.beneficiarioPersonaId = null;
    } else {
      input.beneficiarioPersonaId = null;
      input.beneficiarioProveedorId = null;
    }
    if (this.fechaVencimientoControl.value) {
      const d = new Date(this.fechaVencimientoControl.value);
      const pad = (n: number) => n.toString().padStart(2, '0');
      input.fechaVencimiento = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    input.finanzas = [...this.listaFinanzas];

    this.gastoService.preGastoGuardar(input).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.guardado = true;
        this.idPreGastoGuardado = Number(res.id);
        this.sucursalIdPreGastoGuardado = Number(res.sucursalId);
        this.cargarUltimasSolicitudes();
        this.cdr.markForCheck();
      }
    });
  }

  onImprimir(): void {
    if (this.idPreGastoGuardado) {
      this.gastoService.preGastoImprimir(this.idPreGastoGuardado, this.sucursalIdPreGastoGuardado).pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.reporteService.onAdd('Solicitud de Gasto ' + this.idPreGastoGuardado, res);
          this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, ListPreGastosComponent));
        }
      });
    }
  }

  reimprimir(id: number, sucursalId: number): void {
    if (id) {
      this.gastoService.preGastoImprimir(id, sucursalId || 0).pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.reporteService.onAdd('Solicitud de Gasto ' + id, res);
          this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, ListPreGastosComponent));
        }
      });
    }
  }

  cargarUltimasSolicitudes(): void {
    this.gastoService.preGastoFilter(undefined, undefined, undefined, undefined, this.paginaActual, this.tamanoPagina)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.ultimasSolicitudes = res.getContent || [];
          this.totalElementos = res.getTotalElements || 0;
          this.cdr.markForCheck();
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.paginaActual = event.pageIndex;
    this.tamanoPagina = event.pageSize;
    this.cargarUltimasSolicitudes();
  }

  nuevaSolicitud(): void {
    this.guardado = false;
    this.idPreGastoGuardado = null;
    this.sucursalIdPreGastoGuardado = null;
    this.pasoActual = 0;
    this.data = {};
    this.tieneDatosBien = false;
    this.enteSeleccionado = null;
    this.bienSeleccionadoDescripcion = null;
    this.notificacionVencimiento = null;

    this.tipoGastoControl.reset();
    this.descripcionControl.reset();
    this.monedaControl.reset();
    this.montoControl.reset();
    this.sucursalControl.reset();
    this.formaPagoControl.setValue('EFECTIVO');
    this.urgenciaControl.setValue('NORMAL');
    this.observacionesControl.reset();
    this.beneficiarioPersonaControl.reset();
    this.beneficiarioProveedorControl.reset();
    this.fechaVencimientoControl.reset();
    this.solicitanteControl.reset();
    this.tipoBienControl.reset();
    this.listaFinanzas = [];
    this.finanzaDuplicadaMsg = null;
    this.finanzaMonedaControl.reset();
    this.finanzaFormaPagoControl.setValue('EFECTIVO');
    this.finanzaMontoControl.reset();
    this.selectedFinanzaCurrencyOptions = this.currencyMask.currencyOptionsGuarani;

    this.pasoActual = 0;

    this.cdr.markForCheck();
  }

  cancelar(): void {
    this.tabService.removeTab(this.tabService.currentIndex);
  }

  irAPaso(paso: number): void {
    if (this.isStepVisible(paso)) {
      this.pasoActual = paso;
      this.cdr.markForCheck();
    }
  }

  isStepVisible(step: number): boolean {
    if (step === 1) {
      return this.tieneDatosBien && this.motivoGastoControl.value === 'CUOTA';
    }
    return true;
  }

  getStepNumber(step: number): number {
    let num = 0;
    for (let i = 0; i <= step; i++) {
      if (this.isStepVisible(i)) num++;
    }
    return num;
  }

  pasoSiguiente(): void {
    if (this.pasoActual < 4) {
      let next = this.pasoActual + 1;
      while (!this.isStepVisible(next) && next <= 4) next++;
      this.pasoActual = next;
      this.cdr.markForCheck();
    }
  }

  pasoAnterior(): void {
    if (this.pasoActual > 0) {
      let prev = this.pasoActual - 1;
      while (!this.isStepVisible(prev) && prev >= 0) prev--;
      this.pasoActual = prev;
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
    // ...
    if (!this.data) this.data = {};
    this.data.enteId = undefined;
    this.data.tipoBien = undefined;
    this.data.bienDescripcion = undefined;
    this.data.proveedor = undefined;
    this.cdr.markForCheck();
  }

  abrirBuscadorPersona(): void {
    const data = new SearchListtDialogData();
    data.titulo = 'Seleccionar Beneficiario (Persona)';
    data.query = this.personaSearchPageGQL;
    data.paginator = true;
    data.searchFieldName = 'texto';
    data.tableData = [
      { id: 'id', nombre: 'ID', width: '50px' },
      { id: 'nombre', nombre: 'Nombre', width: 'auto' },
      { id: 'documento', nombre: 'Documento', width: '150px' },
    ];
    this.matDialog.open(SearchListDialogComponent, {
      data: data,
      width: '80%',
      height: '80%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.beneficiarioPersonaControl.setValue(res);
        this.beneficiarioProveedorControl.reset(); // Solo uno
        this.cdr.markForCheck();
      }
    });

  }

  abrirBuscadorProveedor(): void {
    const data = new SearchListtDialogData();
    data.titulo = 'Seleccionar Beneficiario (Proveedor)';
    data.query = this.proveedorSearchByPersonaPageGQL;
    data.paginator = true;
    data.searchFieldName = 'texto';
    data.tableData = [
      { id: 'id', nombre: 'ID', width: '50px' },
      { id: 'persona.nombre', nombre: 'Nombre', width: 'auto' },
      { id: 'persona.documento', nombre: 'RUC/CI', width: '150px' },
    ];
    this.matDialog.open(SearchListDialogComponent, {
      data: data,
      width: '80%',
      height: '80%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.beneficiarioProveedorControl.setValue(res);
        this.beneficiarioPersonaControl.reset(); // Solo uno
        this.cdr.markForCheck();
      }
    });
  }

  agregarFinanza(): void {
    if (this.finanzaMonedaControl.valid && this.finanzaMontoControl.value > 0) {
      const monedaId = this.finanzaMonedaControl.value;
      const formaPago = this.finanzaFormaPagoControl.value;
      const duplicado = this.listaFinanzas.find(
        f => f.monedaId === monedaId && f.formaPago === formaPago
      );
      if (duplicado) {
        const simbolo = this.getSimboloMoneda(monedaId);
        const etiqueta = this.getEtiquetaFormaPago(formaPago);
        this.finanzaDuplicadaMsg = `Ya existe un registro con ${simbolo} y ${etiqueta}. Elimine el existente primero.`;
        this.cdr.markForCheck();
        return;
      }

      this.finanzaDuplicadaMsg = null;
      this.listaFinanzas.push({
        monedaId: monedaId,
        formaPago: formaPago,
        monto: this.finanzaMontoControl.value
      });
      this.finanzaMontoControl.reset();
      this.cdr.markForCheck();
    }
  }

  removerFinanza(index: number): void {
    this.listaFinanzas.splice(index, 1);
    this.finanzaDuplicadaMsg = null;
    this.cdr.markForCheck();
  }

  getSimboloMoneda(id: number): string {
    const found = this.listaMonedas.find(m => m.id === id);
    return found ? found.simbolo : '';
  }

  getIconoFormaPago(formaPago: string): string {
    const found = this.formasPago.find(fp => fp.valor === formaPago);
    return found ? found.icono : 'payments';
  }

  getEtiquetaFormaPago(formaPago: string): string {
    const found = this.formasPago.find(fp => fp.valor === formaPago);
    return found ? found.etiqueta : formaPago;
  }

  calcularMontoTotal(): number {
    return this.listaFinanzas.reduce((sum, f) => sum + (f.monto || 0), 0);
  }

  private cargarDetalleBienYBeneficiario(ente: Ente): void {
    if (!ente?.id) return;
    this.cargandoBien = true;
    this.cdr.markForCheck();

    this.enteFinancialSummaryGQL.fetch({ enteId: ente.id }, { fetchPolicy: 'no-cache' })
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.cargandoBien = false;
        const resumen = res.data.data;
        if (resumen) {
          this.lastResumen = resumen;
          this.bienSeleccionadoDescripcion = resumen.descripcion;
          if (!this.data) this.data = {};

          this.data.enteId = resumen.enteId;
          this.data.bienDescripcion = resumen.descripcion;
          this.data.proveedor = resumen.proveedorNombre;
          this.data.montoTotal = resumen.montoTotal;
          this.data.montoYaPagado = resumen.montoYaPagado;
          this.data.montoPendiente = resumen.montoPendiente;
          this.data.cuotasTotales = resumen.cuotasTotales;
          this.data.cuotasPagadas = resumen.cuotasPagadas;
          this.data.cuotasFaltantes = resumen.cuotasFaltantes;
          this.data.diaVencimiento = resumen.diaVencimiento;
          this.data.diasParaVencer = resumen.diasParaVencer;
          this.data.estadoCuota = resumen.estadoCuota;
          this.data.monedaSimbolo = resumen.monedaSimbolo;
          this.data.situacionPago = resumen.situacionPago;

          if (resumen.monedaId) {
            this.monedaControl.setValue(resumen.monedaId);
          }

          if (resumen.proveedorNombre) {
          }

          if (resumen.diasParaVencer != null) {
            const dias = resumen.diasParaVencer;
            if (dias < 0) {
              this.notificacionVencimiento = `ATENCIÓN: La cuota está vencida hace ${Math.abs(dias)} días.`;
            } else if (dias <= 10) {
              this.notificacionVencimiento = `AVISO: La cuota vence en ${dias} días.`;
            } else {
              this.notificacionVencimiento = `INFO: Faltan ${dias} días para el vencimiento.`;
            }
          }

          this.actualizarCamposPorMotivo(this.motivoGastoControl.value);
        }
        this.cdr.markForCheck();
      }, () => {
        this.cargandoBien = false;
        this.cdr.markForCheck();
      });
  }

  private mapearEnteASolicitudData(ente: Ente, tipoStr: string): void {
    if (!this.data) this.data = {};
    this.data.enteId = ente.id;
    this.data.tipoBien = tipoStr;
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

  actualizarFinanzaCurrencyOptions(): void {
    const monedaId = this.finanzaMonedaControl.value;
    const moneda = this.listaMonedas.find(m => m.id === monedaId);
    if (moneda?.simbolo === 'Gs' || moneda?.simbolo === 'Gs.') {
      this.selectedFinanzaCurrencyOptions = this.currencyMask.currencyOptionsGuarani;
    } else {
      this.selectedFinanzaCurrencyOptions = this.finanzaCurrencyOptionsNoGuarani;
    }
  }

  actualizarCamposPorMotivo(motivo: string): void {
    if (!this.lastResumen) return;
    const resumen = this.lastResumen;

    if (motivo === 'CUOTA') {
      this.montoControl.setValue(resumen.montoSugerido);
      this.descripcionControl.setValue(resumen.descripcionSugerida);
      if (resumen.tipoGastoSugeridoId) {
        const tipoGasto = this.listaTipoGasto.find(tg => tg.tipoNaturaleza === resumen.tipoGastoSugeridoId);
        if (tipoGasto) this.tipoGastoControl.setValue(tipoGasto.id);
      }
    } else {
      this.montoControl.reset();
      let prefijo = '';
      let tipoBusqueda = '';

      switch (motivo) {
        case 'MANTENIMIENTO':
          prefijo = 'Mantenimiento - ';
          tipoBusqueda = 'MANTENIMIENTO';
          break;
        case 'REPUESTO':
          prefijo = 'Repuestos - ';
          tipoBusqueda = 'REPUESTO';
          break;
        case 'IMPUESTO':
          prefijo = 'Impuestos - ';
          tipoBusqueda = 'IMPUESTO';
          break;
      }

      this.descripcionControl.setValue(`${prefijo}${resumen.descripcion}`);
      const tipoGasto = this.listaTipoGasto.find(tg => tg.descripcion.toUpperCase().includes(tipoBusqueda));
      if (tipoGasto) this.tipoGastoControl.setValue(tipoGasto.id);
    }
    this.cdr.markForCheck();
  }
}
