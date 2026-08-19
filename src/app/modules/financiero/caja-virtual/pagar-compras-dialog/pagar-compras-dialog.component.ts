import { Component, Inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual } from '../caja-virtual.model';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { CuentaBancaria } from '../../cuenta-bancaria/cuenta-bancaria.model';
import { CuentaBancariaService } from '../../cuenta-bancaria/cuenta-bancaria.service';
import { CambioService } from '../../cambio/cambio.service';
import { PagarComprasService, SolicitudConLineas, LineaPagoInput, GastoParaPagoInput, ValeConLineas, ValeParaPagoInput } from './pagar-compras.service';
import { ChequeraService } from '../../chequera/chequera.service';
import { EstadoChequera } from '../../chequera/chequera.model';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { dateToString, stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { GastoService } from '../../gastos/service/gasto.service';
import { ProveedorService } from '../../../personas/proveedor/proveedor.service';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { FuncionarioService } from '../../../personas/funcionarios/funcionario.service';
import { MotivoValeService } from '../../../rrhh/motivo-vale/motivo-vale.service';
import { ConceptoRrhh, PagoRrhhConLineas } from './pagar-compras.service';

export interface PagarComprasDialogData {
  cajaVirtual: CajaVirtual;
  // Todos los modos reusan el mismo builder de pago; default COMPRAS.
  //
  // Cardinalidad: COMPRAS/GASTOS/VALES seleccionan varios documentos (carrito); los tres
  // modos de RRHH seleccionan uno solo — la nomina no se paga en una sola operacion, cada
  // liquidacion/finiquito/aguinaldo se paga por separado.
  modo?: 'COMPRAS' | 'GASTOS' | 'VALES' | 'LIQUIDACION' | 'FINIQUITO' | 'AGUINALDO';
}

/** Un cheque del plan de una solicitud (forma de pago CHEQUE ya registrada). */
interface PlanCheque {
  valor: number;        // en la moneda de la deuda
  fechaPago?: string;   // ISO
  diferido: boolean;
  nominal: boolean;
  orden: number;
}

interface SolicitudRow {
  id: number;
  numeroSolicitud: string;
  proveedorId: number;
  proveedorNombre: string;
  monedaId: number;
  monedaSimbolo: string;
  monedaDenominacion: string;
  decimales: number;
  saldoPendiente: number;
  _sel: boolean;
  _disabled: boolean;
  _currencyOpts: any;
  _montoAPagar: number;
  _planCheques: PlanCheque[];   // cheques planificados en la solicitud (forma de pago CHEQUE)
  _descripcion?: string;        // gasto: descripción (observaciones) · vale: observación
  _categoria?: string;          // gasto: categoría (tipoGasto) · vale: motivo
  _esAdelanto?: boolean;        // vale: adelanto de sueldo
  _bloqueado?: boolean;         // no se puede pagar (dato incompleto); nunca seleccionable
  _bloqueoMotivo?: string;
}

interface PagoLinea {
  fuente: 'CAJA_MAYOR' | 'CUENTA_BANCARIA' | 'CHEQUE';
  cuenta?: CuentaBancaria;
  moneda?: Moneda;
  monto: number;
  cotizacion: number;      // 1 unidad de la moneda de la línea = cotizacion de la moneda de la deuda
  necesitaCotizacion: boolean;
  convertido: number;      // monto × cotizacion, en la moneda de la deuda
  _cotizManual?: boolean;  // el usuario editó la cotización (no autopisar)
  _currencyOpts: any;
  // Fuente CHEQUE
  esCheque?: boolean;
  chequeRef?: number;
  chequeraId?: number;
  diferido?: boolean;
  nominal?: boolean;
  beneficiario?: string;
  fechaEmision?: string;   // ISO
  fechaPago?: string;      // ISO
  _numeroCheque?: number;  // display (siguienteNumero proyectado)
  _chequeraNombre?: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-pagar-compras-dialog',
  templateUrl: './pagar-compras-dialog.component.html',
  styleUrls: ['./pagar-compras-dialog.component.scss']
})
export class PagarComprasDialogComponent implements OnInit, AfterViewInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<SolicitudRow>([]);
  displayedColumns = ['sel', 'proveedor', 'numero', 'moneda', 'saldo', 'montoAPagar'];
  filtroProveedorControl = new FormControl('');

  todas: SolicitudRow[] = [];
  monedaList: Moneda[] = [];
  cuentaList: CuentaBancaria[] = [];

  // Contexto de la deuda seleccionada (todas del mismo proveedor y moneda).
  proveedorSel: number | null = null;
  proveedorNombreSel = '';
  monedaDeuda: Moneda | null = null;
  monedaPrincipal: Moneda | null = null;
  totalDeuda = 0;
  totalDeudaPrincipal = 0;
  cantidadNotas = 0;
  mostrarPrincipal = false;

  lineas: PagoLinea[] = [];
  draft!: PagoLinea;            // formulario de forma de pago siempre visible
  draftValido = false;
  editIndex = -1;              // índice que se está editando (-1 = alta nueva)
  totalPago = 0;
  faltantePago = 0;           // totalDeuda - totalPago (en moneda de la deuda; con signo)
  balanceOk = false;

  // Ajuste por diferencia de cambio/redondeo (opción 3: línea AJUSTE descuento/aumento).
  ajusteDisponible = false;   // hay una diferencia pequeña que se puede marcar como ajuste
  ajusteAplicado = false;     // el usuario aceptó registrar la diferencia como ajuste
  ajusteTipo: 'DESCUENTO' | 'AUMENTO' = 'DESCUENTO';
  ajusteMonto = 0;            // magnitud de la diferencia (en moneda de la deuda)
  haySeleccion = false;

  // Cheque (cuando la cuenta bancaria del draft tiene chequera activa con hojas)
  chequerasCuenta: any[] = [];
  puedeCheque = false;
  chequeActivo = false;
  chequeraSel: any = null;
  chequeDiferido = true;
  chequeNominal = true;
  chequeBeneficiario = '';
  chequeFechaEmision: Date = new Date();
  chequeFechaPago: Date = new Date();
  chequeCuotas = 1;
  chequeIntervalo = 30;
  intervalos = [7, 15, 30, 45];
  cuotasOpciones = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  chequeValido = false;
  chequesList: PagoLinea[] = [];
  hayCheques = false;
  private chequeRefSeq = 1;

  // Plan de la solicitud: cheques ya planificados → se autogeneran eligiendo una chequera.
  chequerasActivas: any[] = [];
  planCheques: PlanCheque[] = [];
  tienePlanCheques = false;
  planChequeraSel: any = null;
  planGenerado = false;
  planTotal = 0;

  isLoading = false;
  isSaving = false;

  // ── Modo GASTOS (mismo builder de pago; fuente = gastosPendientes + alta de gasto) ──
  esGasto = false;
  titulo = 'Pagar Compras (CPP)';
  vistaNuevoGasto = false;       // true = oculta el stepper y muestra solo el form de gasto
  creandoGasto = false;

  // ── Modos de RRHH: LIQUIDACION / FINIQUITO / AGUINALDO ──
  // Mismo builder y mismo puente que el vale (la obligacion de pago es una SolicitudPago
  // tipo RRHH), pero el documento no se puede crear desde la caja: nace en RRHH, aprobado.
  esRrhh = false;
  conceptoRrhh: ConceptoRrhh | null = null;
  /** Los modos de RRHH pagan de a uno: tildar una fila destilda las demas. */
  seleccionSimple = false;

  /** Plural del concepto, para los textos de la tabla vacia y del resumen. */
  get tituloPlural(): string {
    switch (this.conceptoRrhh) {
      case 'LIQUIDACION': return 'liquidaciones';
      case 'FINIQUITO':   return 'finiquitos';
      case 'AGUINALDO':   return 'aguinaldos';
      default:            return 'documentos';
    }
  }

  // ── Modo VALES (mismo builder; fuente = valesPendientes + alta de vale) ──
  // La unidad pagable es el vale de RRHH: el backend le resuelve su obligación de pago.
  esVale = false;
  // El vale se paga entero o no se paga: la liquidación descuenta el monto total del vale,
  // así que entregar de menos dejaría plata fuera de caja que nunca se recupera del sueldo.
  montoEditable = true;
  funcionarioFiltrados: Funcionario[] = [];
  motivoList: any[] = [];
  nvFuncionarioControl = new FormControl(null);
  nvMotivoControl = new FormControl(null);
  nvMontoControl = new FormControl(null);
  nvEsAdelantoControl = new FormControl(true);
  nvObservacionControl = new FormControl('');
  displayFuncionario = (f: Funcionario): string => (f && f.persona) ? (f.persona.nombre || '') : '';
  // Filtros de la tabla de gastos
  filtroIdControl = new FormControl('');
  filtroCategoriaControl = new FormControl('');
  filtroDescripcionControl = new FormControl('');
  // Form de nuevo gasto
  proveedorFiltrados: Proveedor[] = [];
  tipoGastoFiltrados: any[] = [];
  nuevoGastoCurrencyOpts: any;
  ngBeneficiarioControl = new FormControl(null);
  ngTipoGastoControl = new FormControl(null);          // autocomplete (categoría obligatoria)
  ngDescripcionControl = new FormControl('');
  ngMonedaControl = new FormControl(null);
  ngMontoControl = new FormControl(null);
  ngVencimientoControl = new FormControl(null);
  displayProveedor = (p: Proveedor): string => (p && p.persona) ? (p.persona.nombre || '') : '';
  displayTipoGasto = (t: any): string => (t && t.descripcion) ? t.descripcion : '';

  // Caché de cotización a Guaraní por moneda (valorEnGsCompraMercado). Principal = 1.
  private rateGs: Record<number, number> = {};

  private _draftInit = false;

  constructor(
    private dialogRef: MatDialogRef<PagarComprasDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PagarComprasDialogData,
    private pagarComprasService: PagarComprasService,
    private monedaService: MonedaService,
    private cuentaBancariaService: CuentaBancariaService,
    private cambioService: CambioService,
    private chequeraService: ChequeraService,
    private notificacion: NotificacionSnackbarService,
    private gastoService: GastoService,
    private proveedorService: ProveedorService,
    private funcionarioService: FuncionarioService,
    private motivoValeService: MotivoValeService,
  ) {}

  ngOnInit(): void {
    this.esGasto = this.data?.modo === 'GASTOS';
    this.esVale = this.data?.modo === 'VALES';
    this.esRrhh = this.data?.modo === 'LIQUIDACION' || this.data?.modo === 'FINIQUITO'
      || this.data?.modo === 'AGUINALDO';
    if (this.esRrhh) {
      this.conceptoRrhh = this.data.modo as ConceptoRrhh;
      this.seleccionSimple = true;
      // El documento se paga entero: ni la liquidacion ni el finiquito ni el aguinaldo
      // llevan saldo, entregar de menos deja una diferencia que nadie reclama despues.
      this.montoEditable = false;
      this.titulo = this.conceptoRrhh === 'LIQUIDACION' ? 'Pagar Liquidación'
        : this.conceptoRrhh === 'FINIQUITO' ? 'Pagar Finiquito' : 'Pagar Aguinaldo';
      this.displayedColumns = ['sel', 'id', 'funcionario', 'periodo', 'descripcion', 'saldo', 'montoAPagar'];
      // Filtros de la tabla: N° / Funcionario (client-side sobre lo cargado).
      this.filtroIdControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.aplicarFiltro());
    }
    if (this.esVale) {
      this.titulo = 'Pagar Vale';
      this.montoEditable = false;
      this.displayedColumns = ['sel', 'id', 'funcionario', 'motivo', 'descripcion', 'saldo', 'montoAPagar'];
      this.motivoValeService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) this.motivoList = res;
      });
      // Autocomplete de funcionario por nombre (server-side).
      this.nvFuncionarioControl.valueChanges.pipe(untilDestroyed(this)).subscribe(val => {
        if (typeof val === 'string' && val.trim().length >= 2) {
          this.funcionarioService.onFuncionarioSearch(val.trim()).pipe(untilDestroyed(this))
            .subscribe(r => this.funcionarioFiltrados = r || []);
        } else if (typeof val !== 'string') { this.funcionarioFiltrados = []; }
      });
      // Filtros de la tabla: N° / Funcionario / Motivo (client-side sobre lo cargado).
      this.filtroIdControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.aplicarFiltro());
      this.filtroCategoriaControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.aplicarFiltro());
    }
    if (this.esGasto) {
      this.titulo = 'Pagar Gasto';
      this.displayedColumns = ['sel', 'id', 'categoria', 'proveedor', 'descripcion', 'saldo', 'montoAPagar'];
      // Autocomplete de beneficiario (proveedor, opcional).
      this.ngBeneficiarioControl.valueChanges.pipe(untilDestroyed(this)).subscribe(val => {
        if (typeof val === 'string' && val.trim().length >= 2) {
          this.proveedorService.onSearch(val.trim()).pipe(untilDestroyed(this)).subscribe(r => this.proveedorFiltrados = r || []);
        } else if (typeof val !== 'string') { this.proveedorFiltrados = []; }
      });
      // Autocomplete de categoría (server-side; pueden ser cientos).
      this.ngTipoGastoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(val => {
        if (typeof val === 'string' && val.trim().length >= 1) {
          this.gastoService.tipoGastoOnSearch(val.trim()).pipe(untilDestroyed(this)).subscribe(r => this.tipoGastoFiltrados = r || []);
        } else if (typeof val !== 'string') { this.tipoGastoFiltrados = []; }
      });
      // Filtros de la tabla (client-side sobre lo cargado).
      this.filtroIdControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.aplicarFiltro());
      this.filtroCategoriaControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.aplicarFiltro());
      this.filtroDescripcionControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.aplicarFiltro());
    }
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.monedaList = res;
        this.monedaPrincipal = res.find((m: any) => m.principal) || null;
        if ((this.esGasto || this.esVale) && !this.ngMonedaControl.value) {
          const gs = res.find((m: any) => (m.denominacion || '').toUpperCase().includes('GUARANI')) || res[0];
          this.ngMonedaControl.setValue(gs);
          this.onNuevoGastoMonedaChange();
        }
      }
    });
    this.cuentaBancariaService.onGetAllOperables().pipe(untilDestroyed(this)).subscribe(res => { if (res) this.cuentaList = res; });
    // Chequeras activas con hojas (para autogenerar cheques del plan de la solicitud).
    this.chequeraService.onGetChequeras(0, 200).pipe(untilDestroyed(this)).subscribe(res => {
      this.chequerasActivas = (res || []).filter((c: any) => c.estado === EstadoChequera.ACTIVA && (c.hojasDisponibles || 0) > 0);
    });
    this.cargar();
    this.filtroProveedorControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.aplicarFiltro());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  cargar() {
    this.isLoading = true;
    const fuente$ = this.esRrhh
      ? (this.conceptoRrhh === 'LIQUIDACION' ? this.pagarComprasService.onGetLiquidacionesPendientes()
        : this.conceptoRrhh === 'FINIQUITO' ? this.pagarComprasService.onGetFiniquitosPendientes()
        : this.pagarComprasService.onGetAguinaldosPendientes())
      : this.esVale
        ? this.pagarComprasService.onGetValesPendientes()
        : this.esGasto
          ? this.pagarComprasService.onGetGastosPendientes()
          : this.pagarComprasService.onGetPendientes();
    fuente$.pipe(untilDestroyed(this)).subscribe(res => {
      this.isLoading = false;
      this.todas = (res || []).map((s: any) => this.esRrhh ? this.toRowRrhh(s)
        : this.esVale ? this.toRowVale(s) : this.toRow(s));
      this.aplicarFiltro();
    });
  }

  /** Fila del modo VALES: el "N°" es el id del vale y el tercero es el funcionario. */
  private toRowVale(v: any): SolicitudRow {
    const saldo = v.saldoPendiente != null ? v.saldoPendiente : (v.monto || 0);
    const nombre = v.funcionarioNombre || v.funcionario?.persona?.nombre || '—';
    return {
      id: v.id, numeroSolicitud: String(v.id),
      proveedorId: v.funcionario?.id, proveedorNombre: nombre,
      monedaId: v.moneda?.id, monedaSimbolo: v.moneda?.simbolo || '',
      monedaDenominacion: v.moneda?.denominacion || '',
      decimales: this.decimales(v.moneda), saldoPendiente: saldo,
      _sel: false, _disabled: false, _montoAPagar: saldo, _currencyOpts: this.currencyOpts(v.moneda),
      _planCheques: [],
      _descripcion: v.observacion || '',
      _categoria: v.motivoDescripcion || v.motivo?.descripcion || '',
      _esAdelanto: !!v.esAdelanto,
      // Hay vales viejos sin moneda: sin ella no se sabe en qué moneda sale la plata.
      _bloqueado: !v.moneda?.id,
      _bloqueoMotivo: !v.moneda?.id ? 'Sin moneda definida: corregilo desde RRHH' : undefined,
    };
  }

  /**
   * Fila de los modos de RRHH. El "N°" es el id del documento y el tercero es el
   * funcionario; el "periodo" ubica el documento (2026-07 en liquidacion, 2026 en aguinaldo).
   */
  private toRowRrhh(p: any): SolicitudRow {
    const saldo = p.saldoPendiente != null ? p.saldoPendiente : (p.monto || 0);
    const nombre = p.funcionarioNombre || p.funcionario?.persona?.nombre || '—';
    const sinMoneda = !p.moneda?.id;
    return {
      id: p.id, numeroSolicitud: String(p.id),
      proveedorId: p.funcionario?.id, proveedorNombre: nombre,
      monedaId: p.moneda?.id, monedaSimbolo: p.moneda?.simbolo || '',
      monedaDenominacion: p.moneda?.denominacion || '',
      decimales: this.decimales(p.moneda), saldoPendiente: saldo,
      _sel: false, _disabled: false, _montoAPagar: saldo, _currencyOpts: this.currencyOpts(p.moneda),
      _planCheques: [],
      _descripcion: p.descripcion || '',
      _categoria: p.periodo || '',
      // Sin moneda no se sabe en que moneda sale la plata; saldo 0 no tiene nada que pagar.
      _bloqueado: sinMoneda || saldo <= 0,
      _bloqueoMotivo: sinMoneda
        ? 'Sin moneda: falta configurar la moneda principal'
        : (saldo <= 0 ? 'Sin saldo pendiente' : undefined),
    };
  }

  private toRow(s: any): SolicitudRow {
    const saldo = Math.max(0, (s.montoTotal || 0) - (s.montoPagado || 0));
    const planCheques: PlanCheque[] = (s.detalles || [])
      .filter((d: any) => (d.formaPago?.descripcion || '').toUpperCase().includes('CHEQUE'))
      .map((d: any) => ({
        valor: d.valor || 0,
        fechaPago: d.fechaPago,
        diferido: d.diferido !== false,
        nominal: d.nominal !== false,
        orden: d.orden != null ? d.orden : 0,
      }))
      .sort((a: PlanCheque, b: PlanCheque) => a.orden - b.orden);
    // En gasto, la columna Beneficiario muestra el proveedor o "—" (la descripción tiene su propia columna).
    const nombreMostrar = s.proveedor?.persona?.nombre || (this.esGasto ? '—' : '-');
    return {
      id: s.id, numeroSolicitud: s.numeroSolicitud,
      proveedorId: s.proveedor?.id, proveedorNombre: nombreMostrar,
      monedaId: s.moneda?.id, monedaSimbolo: s.moneda?.simbolo || '', monedaDenominacion: s.moneda?.denominacion || '',
      decimales: this.decimales(s.moneda), saldoPendiente: saldo,
      _sel: false, _disabled: false, _montoAPagar: saldo, _currencyOpts: this.currencyOpts(s.moneda),
      _planCheques: planCheques, _descripcion: s.observaciones, _categoria: s.tipoGasto?.descripcion || '',
    };
  }

  private decimales(moneda: any): number {
    return moneda?.decimales != null ? moneda.decimales : ((moneda?.denominacion || '').toUpperCase().includes('GUARANI') ? 0 : 2);
  }

  private currencyOpts(moneda: any): any {
    const dec = this.decimales(moneda);
    return {
      allowNegative: false, allowZero: false, precision: dec,
      thousands: '.', decimal: dec > 0 ? ',' : '', align: 'right',
      prefix: (moneda?.simbolo ? moneda.simbolo + ' ' : ''), suffix: '', nullable: true, min: 0, max: null,
    };
  }

  aplicarFiltro() {
    if (this.esVale) {
      const fid = (this.filtroIdControl.value || '').trim();
      const ffun = (this.filtroProveedorControl.value || '').toUpperCase().trim();
      const fmot = (this.filtroCategoriaControl.value || '').toUpperCase().trim();
      this.dataSource.data = this.todas.filter(r =>
        (!fid || String(r.id).includes(fid)) &&
        (!ffun || (r.proveedorNombre || '').toUpperCase().includes(ffun)) &&
        (!fmot || (r._categoria || '').toUpperCase().includes(fmot))
      );
      return;
    }
    if (this.esRrhh) {
      const fid = (this.filtroIdControl.value || '').trim();
      const ffun = (this.filtroProveedorControl.value || '').toUpperCase().trim();
      this.dataSource.data = this.todas.filter(r =>
        (!fid || String(r.id).includes(fid)) &&
        (!ffun || (r.proveedorNombre || '').toUpperCase().includes(ffun))
      );
      return;
    }
    if (this.esGasto) {
      const fid = (this.filtroIdControl.value || '').trim();
      const fcat = (this.filtroCategoriaControl.value || '').toUpperCase().trim();
      const fprov = (this.filtroProveedorControl.value || '').toUpperCase().trim();
      const fdesc = (this.filtroDescripcionControl.value || '').toUpperCase().trim();
      this.dataSource.data = this.todas.filter(r =>
        (!fid || String(r.id).includes(fid)) &&
        (!fcat || (r._categoria || '').toUpperCase().includes(fcat)) &&
        (!fprov || (r.proveedorNombre || '').toUpperCase().includes(fprov)) &&
        (!fdesc || (r._descripcion || '').toUpperCase().includes(fdesc))
      );
      return;
    }
    const t = (this.filtroProveedorControl.value || '').toUpperCase().trim();
    this.dataSource.data = t ? this.todas.filter(r => r.proveedorNombre.toUpperCase().includes(t)) : this.todas;
  }

  // ── Alta de gasto (vista de form; oculta el stepper) ──
  abrirNuevoGasto() {
    if (!this.ngMonedaControl.value && this.monedaList.length) {
      const gs = this.monedaList.find((m: any) => (m.denominacion || '').toUpperCase().includes('GUARANI')) || this.monedaList[0];
      this.ngMonedaControl.setValue(gs);
      this.onNuevoGastoMonedaChange();
    }
    this.vistaNuevoGasto = true;
  }

  cerrarNuevoGasto() { this.vistaNuevoGasto = false; }

  onNuevoGastoMonedaChange() {
    this.nuevoGastoCurrencyOpts = this.currencyOpts(this.ngMonedaControl.value);
  }

  crearGasto() {
    const cat: any = this.ngTipoGastoControl.value;
    if (!cat || typeof cat === 'string' || !cat.id) {
      this.notificacion.openAlgoSalioMal('La categoría es obligatoria');
      return;
    }
    const moneda: any = this.ngMonedaControl.value;
    const monto = this.ngMontoControl.value;
    const desc = (this.ngDescripcionControl.value || '').trim();
    if (!moneda || !monto || monto <= 0 || !desc) {
      this.notificacion.openAlgoSalioMal('Completá descripción, monto y moneda del gasto');
      return;
    }
    const ben: any = this.ngBeneficiarioControl.value;
    const input: GastoParaPagoInput = {
      tipoGastoId: cat.id,
      descripcion: desc,
      monedaId: moneda.id,
      monto,
      beneficiarioProveedorId: (ben && typeof ben !== 'string') ? ben.id : undefined,
      fechaVencimiento: this.ngVencimientoControl.value ? dateToString(this.ngVencimientoControl.value) : undefined,
    };
    this.creandoGasto = true;
    this.pagarComprasService.onCrearGasto(input).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.creandoGasto = false;
        this.notificacion.openSucess('Gasto creado');
        this.ngTipoGastoControl.reset(); this.ngDescripcionControl.reset('');
        this.ngMontoControl.reset(); this.ngBeneficiarioControl.reset(); this.ngVencimientoControl.reset();
        this.vistaNuevoGasto = false;   // volver al stepper con la tabla actualizada
        this.cargar();
      },
      error: (err) => {
        this.creandoGasto = false;
        this.notificacion.openAlgoSalioMal(err?.message || 'Error al crear el gasto');
      }
    });
  }

  // ── Alta de vale (misma vista que el alta de gasto; oculta el stepper) ──
  abrirNuevoVale() {
    if (!this.ngMonedaControl.value && this.monedaList.length) {
      const gs = this.monedaList.find((m: any) => (m.denominacion || '').toUpperCase().includes('GUARANI')) || this.monedaList[0];
      this.ngMonedaControl.setValue(gs);
      this.onNuevoGastoMonedaChange();
    }
    this.vistaNuevoGasto = true;
  }

  crearVale() {
    const funcionario: any = this.nvFuncionarioControl.value;
    if (!funcionario || typeof funcionario === 'string' || !funcionario.id) {
      this.notificacion.openAlgoSalioMal('Seleccioná un funcionario válido de la lista');
      return;
    }
    const moneda: any = this.ngMonedaControl.value;
    const monto = this.nvMontoControl.value;
    if (!moneda || !monto || monto <= 0) {
      this.notificacion.openAlgoSalioMal('Completá el monto y la moneda del vale');
      return;
    }
    const input: ValeParaPagoInput = {
      funcionarioId: funcionario.id,
      motivoId: this.nvMotivoControl.value?.id || undefined,
      monedaId: moneda.id,
      monto,
      esAdelanto: !!this.nvEsAdelantoControl.value,
      observacion: (this.nvObservacionControl.value || '').trim() || undefined,
    };
    this.creandoGasto = true;
    this.pagarComprasService.onCrearVale(input).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.creandoGasto = false;
        this.notificacion.openSucess('Vale registrado (pendiente de pago)');
        this.nvFuncionarioControl.reset(); this.nvMotivoControl.reset();
        this.nvMontoControl.reset(); this.nvObservacionControl.reset('');
        this.nvEsAdelantoControl.setValue(true);
        this.vistaNuevoGasto = false;   // volver al stepper con la tabla actualizada
        this.cargar();
      },
      error: (err) => {
        this.creandoGasto = false;
        this.notificacion.openAlgoSalioMal(err?.message || 'Error al registrar el vale');
      }
    });
  }

  // ── Paso 1: selección (mismo proveedor + misma moneda) ──
  onToggle(row: SolicitudRow) {
    if (row._disabled || row._bloqueado) return;
    const nuevo = !row._sel;
    // Los modos de RRHH pagan de a uno: tildar una fila destilda cualquier otra.
    if (this.seleccionSimple && nuevo) this.todas.forEach(r => r._sel = false);
    row._sel = nuevo;
    this.recomputarSeleccion();
  }

  private recomputarSeleccion() {
    const sel = this.todas.filter(r => r._sel);
    if (sel.length === 0) {
      this.proveedorSel = null; this.proveedorNombreSel = ''; this.monedaDeuda = null;
      this.todas.forEach(r => r._disabled = !!r._bloqueado);
      this.lineas = []; this._draftInit = false;
    } else {
      const primero = sel[0];
      this.proveedorSel = primero.proveedorId;
      this.proveedorNombreSel = primero.proveedorNombre;
      this.monedaDeuda = this.monedaList.find(m => m.id === primero.monedaId) || null;
      // Compras: mismo proveedor + misma moneda. Gastos y vales: solo misma moneda
      // (el beneficiario/funcionario puede variar o faltar).
      this.todas.forEach(r => r._disabled = r._bloqueado || !r._sel && ((this.esGasto || this.esVale || this.esRrhh)
        ? r.monedaId !== primero.monedaId
        : (r.proveedorId !== primero.proveedorId || r.monedaId !== primero.monedaId)));
      if (this.monedaDeuda) this.getRateGs(this.monedaDeuda).pipe(untilDestroyed(this)).subscribe(); // warm cache
      if (!this._draftInit) { this.nuevoDraft(); this._draftInit = true; }
    }
    this.haySeleccion = sel.length > 0;
    this.totalDeuda = sel.reduce((s, r) => s + (r._montoAPagar || 0), 0);
    this.recalcularTotalesNotas();
    this.recalcularPago();
    if (this._draftInit) this.refrescarMontoDraft();
    this.recomputarPlan(sel);
  }

  /** Junta los cheques planificados de las solicitudes seleccionadas y prepara el panel de plan. */
  private recomputarPlan(sel: SolicitudRow[]) {
    this.planCheques = sel.flatMap(r => r._planCheques || []);
    this.planTotal = this.round(this.planCheques.reduce((s, c) => s + (c.valor || 0), 0), this.monedaDeuda);
    this.tienePlanCheques = this.planCheques.length > 0;
    this.planGenerado = false;
    // Chequeras candidatas: activas, en la moneda de la deuda, con hojas suficientes para los N cheques.
    const n = this.planCheques.length;
    const candidatas = this.chequerasActivas.filter(c =>
      (c.cuentaBancaria?.moneda?.id === this.monedaDeuda?.id) && (c.hojasDisponibles || 0) >= n);
    this.planChequeraSel = candidatas[0] || null;
  }

  /** Genera una línea de pago CHEQUE por cada cheque del plan, usando la chequera elegida (números consecutivos). */
  generarChequesDelPlan() {
    if (!this.planChequeraSel || this.planCheques.length === 0) return;
    const ch = this.planChequeraSel;
    const cuenta = this.cuentaList.find(c => c.id === ch.cuentaBancaria?.id)
      || (ch.cuentaBancaria as any);
    const sig = Number(ch.siguienteNumero) || 0;
    this.planCheques.forEach((pc, i) => {
      this.lineas.push({
        fuente: 'CHEQUE', cuenta, moneda: this.monedaDeuda!,
        monto: pc.valor, cotizacion: 1, necesitaCotizacion: false, convertido: pc.valor,
        _currencyOpts: this.currencyOpts(this.monedaDeuda),
        esCheque: true, chequeRef: this.chequeRefSeq++, chequeraId: ch.id,
        diferido: pc.diferido, nominal: pc.nominal,
        beneficiario: this.proveedorNombreSel,
        fechaEmision: dateToString(new Date()),
        // stringToLocalDate evita el corrimiento de un día (new Date('yyyy-MM-dd') = medianoche UTC).
        fechaPago: pc.fechaPago ? dateToString(stringToLocalDate(pc.fechaPago)) : dateToString(new Date()),
        _numeroCheque: sig + i, _chequeraNombre: ch.nombre,
      });
    });
    this.planGenerado = true;
    this.recalcularPago();
    this.notificacion.openSucess(`${this.planCheques.length} cheque(s) generados del plan`);
  }

  onMontoNotaChange() {
    this.totalDeuda = this.todas.filter(r => r._sel).reduce((s, r) => s + (r._montoAPagar || 0), 0);
    this.recalcularTotalesNotas();
    this.recalcularPago();
  }

  /** Totales de las notas seleccionadas: cantidad + total en moneda de la deuda + total en principal. */
  private recalcularTotalesNotas() {
    this.cantidadNotas = this.todas.filter(r => r._sel).length;
    this.mostrarPrincipal = !!(this.monedaDeuda && this.monedaPrincipal && this.monedaDeuda.id !== this.monedaPrincipal.id);
    if (!this.mostrarPrincipal) { this.totalDeudaPrincipal = this.totalDeuda; return; }
    this.getRateGs(this.monedaDeuda!).pipe(untilDestroyed(this)).subscribe(r => {
      this.totalDeudaPrincipal = this.round(this.totalDeuda * (r || 1), this.monedaPrincipal);
    });
  }

  // ── Paso 2: formas de pago (form draft siempre visible + lista) ──

  /** Crea un draft nuevo (efectivo caja mayor, moneda de la deuda, restante prefijado). */
  private nuevoDraft() {
    const moneda = this.monedaDeuda;
    const restante = Math.max(0, this.round(this.totalDeuda - this.totalPago, moneda));
    this.draft = {
      fuente: 'CAJA_MAYOR', cuenta: undefined, moneda: moneda,
      monto: restante > 0 ? restante : 0,
      cotizacion: 1, necesitaCotizacion: false, convertido: 0,
      _currencyOpts: this.currencyOpts(moneda),
    };
    this.editIndex = -1;
    this.actualizarLinea(this.draft);
  }

  /** Actualiza el monto del draft al restante (cuando cambia la deuda y no se está editando). */
  private refrescarMontoDraft() {
    if (this.editIndex >= 0 || !this.draft) return;
    const restante = Math.max(0, this.round(this.totalDeuda - this.totalPago, this.draft.moneda));
    this.draft.monto = restante > 0 ? restante : 0;
    this.recalcularDraft();
  }

  /** Confirma el draft: lo agrega a la lista (o reemplaza si se estaba editando) y resetea. */
  agregarDraft() {
    if (this.chequeActivo && this.draft.fuente === 'CUENTA_BANCARIA') { this.agregarCheques(); return; }
    if (!this.draftValido) return;
    const linea: PagoLinea = { ...this.draft };
    if (this.editIndex >= 0) this.lineas[this.editIndex] = linea;
    else this.lineas.push(linea);
    this.recalcularPago();
    this.nuevoDraft();
  }

  /** Genera N líneas CHEQUE (cuotas) encadenadas por intervalo de días desde la fecha de pago. */
  private agregarCheques() {
    if (!this.chequeraSel || !this.draft.monto || this.draft.monto <= 0) return;
    const cuotas = Math.max(1, Math.min(12, this.chequeCuotas || 1));
    const total = this.draft.monto;                       // en la moneda de la cuenta
    const cuota = this.round(total / cuotas, this.draft.moneda);
    const sig = Number(this.chequeraSel.siguienteNumero) || 0;
    for (let i = 0; i < cuotas; i++) {
      const monto = (i === cuotas - 1) ? this.round(total - cuota * (cuotas - 1), this.draft.moneda) : cuota;
      const fecha = this.addDias(this.chequeFechaPago, cuotas > 1 ? i * this.chequeIntervalo : 0);
      this.lineas.push({
        fuente: 'CHEQUE', cuenta: this.draft.cuenta, moneda: this.draft.moneda,
        monto, cotizacion: this.draft.cotizacion, necesitaCotizacion: this.draft.necesitaCotizacion, convertido: 0,
        _currencyOpts: this.currencyOpts(this.draft.moneda),
        esCheque: true, chequeRef: this.chequeRefSeq++, chequeraId: this.chequeraSel.id,
        diferido: this.chequeDiferido, nominal: this.chequeNominal,
        beneficiario: this.chequeBeneficiario || this.proveedorNombreSel,
        fechaEmision: dateToString(this.chequeFechaEmision),
        fechaPago: dateToString(fecha),
        _numeroCheque: sig + i, _chequeraNombre: this.chequeraSel.nombre,
      });
    }
    this.recalcularPago();
    this.chequeActivo = false; this.chequeCuotas = 1;
    this.nuevoDraft();
  }

  private addDias(base: Date, dias: number): Date {
    const d = new Date(base); d.setDate(d.getDate() + dias); return d;
  }

  /** Carga una línea de la lista de vuelta al draft para editarla. */
  editarLinea(i: number) {
    this.draft = { ...this.lineas[i] };
    this.draft._currencyOpts = this.currencyOpts(this.draft.moneda);
    this.editIndex = i;
    this.recalcularDraft();
  }

  quitarLinea(i: number) {
    this.lineas.splice(i, 1);
    if (this.editIndex === i) this.nuevoDraft();
    else if (this.editIndex > i) this.editIndex--;
    this.recalcularPago();
    this.refrescarMontoDraft();
  }

  cancelarEdicion() { this.nuevoDraft(); }

  onFuenteChange(l: PagoLinea) {
    if (l.fuente === 'CAJA_MAYOR') { l.cuenta = undefined; l.moneda = this.monedaDeuda; }
    else { l.moneda = l.cuenta ? this.resolverMoneda(l.cuenta.moneda) : undefined; }
    // Cheque solo aplica a cuenta bancaria; resetear al cambiar de fuente.
    this.chequeActivo = false; this.puedeCheque = false; this.chequerasCuenta = []; this.chequeraSel = null;
    if (l.fuente === 'CUENTA_BANCARIA' && l.cuenta) this.cargarChequeras(l.cuenta);
    this.actualizarLinea(l, true);
  }

  onCuentaChange(l: PagoLinea) {
    l.moneda = this.resolverMoneda(l.cuenta?.moneda);
    this.cargarChequeras(l.cuenta);
    this.actualizarLinea(l, true);
  }

  /** Carga las chequeras activas de la cuenta y habilita la opción de pagar con cheque si hay hojas. */
  private cargarChequeras(cuenta: any) {
    this.chequeActivo = false; this.puedeCheque = false; this.chequerasCuenta = []; this.chequeraSel = null;
    if (!cuenta?.id) return;
    this.pagarComprasService.onGetChequerasPorCuenta(cuenta.id).pipe(untilDestroyed(this)).subscribe(res => {
      this.chequerasCuenta = (res || []).filter((c: any) => (c.hojasDisponibles || 0) > 0);
      this.puedeCheque = this.chequerasCuenta.length > 0;
      if (this.puedeCheque) {
        this.chequeraSel = this.chequerasCuenta[0];
        if (!this.chequeBeneficiario) this.chequeBeneficiario = this.proveedorNombreSel;
      }
    });
  }

  onToggleCheque() {
    this.chequeActivo = !this.chequeActivo && this.puedeCheque;
    if (this.chequeActivo && !this.chequeBeneficiario) this.chequeBeneficiario = this.proveedorNombreSel;
    this.recalcularCheque();
  }

  recalcularCheque() {
    this.chequeValido = this.chequeActivo && !!this.chequeraSel && (this.draft?.monto || 0) > 0
      && !!this.chequeFechaPago && (this.chequeCuotas <= 1 || !!this.chequeIntervalo)
      && this.chequeCuotas <= (this.chequeraSel?.hojasDisponibles || 0);
  }

  onMonedaLineaChange(l: PagoLinea) { l._cotizManual = false; this.actualizarLinea(l, true); }
  onMontoLineaChange() { this.recalcularDraft(); this.recalcularCheque(); }
  onCotizacionChange(l: PagoLinea) { l._cotizManual = true; this.recalcularDraft(); }

  /**
   * Recalcula formato + si el draft necesita cotización, y la precarga (compra mercado).
   * Si preservarConvertido: mantiene el valor en la moneda de la deuda y recomputa el monto con la nueva cotización.
   */
  private actualizarLinea(l: PagoLinea, preservarConvertido = false) {
    const objetivo = l.convertido;   // valor en moneda de la deuda antes del cambio de moneda
    l._currencyOpts = this.currencyOpts(l.moneda);
    l.necesitaCotizacion = !!(l.moneda && this.monedaDeuda && l.moneda.id !== this.monedaDeuda.id);
    if (!l.necesitaCotizacion) {
      l.cotizacion = 1;
      if (preservarConvertido && objetivo > 0) l.monto = this.round(objetivo, l.moneda);
      this.recalcularDraft();
      return;
    }
    // Cotización = cuántas unidades de la moneda de la deuda equivale 1 de la moneda de la línea (pivote Gs).
    const ml = l.moneda!, md = this.monedaDeuda!;
    this.getRateGs(ml).pipe(untilDestroyed(this)).subscribe(rL => {
      this.getRateGs(md).pipe(untilDestroyed(this)).subscribe(rD => {
        if (!l._cotizManual && rL != null && rD != null && rD > 0) {
          l.cotizacion = this.round(rL / rD, null, 6);
        }
        if (preservarConvertido && objetivo > 0 && l.cotizacion > 0) {
          l.monto = this.round(objetivo / l.cotizacion, l.moneda);
        }
        this.recalcularDraft();
      });
    });
    this.recalcularDraft();
  }

  /** Recalcula el convertido del draft y su validez. */
  private recalcularDraft() {
    const d = this.draft;
    if (!d) { this.draftValido = false; return; }
    d.convertido = this.round((d.monto || 0) * (d.cotizacion || 0), this.monedaDeuda);
    this.draftValido = !!d.moneda
      && !(d.fuente === 'CUENTA_BANCARIA' && !d.cuenta)
      && (d.monto || 0) > 0
      && !(d.necesitaCotizacion && (!d.cotizacion || d.cotizacion <= 0));
  }

  /** Tasa a Guaraní de una moneda (valorEnGsCompraMercado). Principal = 1. Cachea el resultado. */
  private getRateGs(moneda: Moneda): Observable<number | null> {
    if ((moneda as any).principal) return of(1);
    if (this.rateGs[moneda.id] != null) return of(this.rateGs[moneda.id]);
    return this.cambioService.getUltimoCambioPorMonedaId(moneda.id).pipe(map((c: any) => {
      const t = c?.valorEnGsCompraMercado ?? c?.valorEnGsVentaMercado ?? c?.valorEnGs ?? null;
      if (t && t > 0) this.rateGs[moneda.id] = t;
      return t && t > 0 ? t : null;
    }));
  }

  private resolverMoneda(m: any): Moneda | undefined {
    if (!m) return undefined;
    return this.monedaList.find(x => x.id === m.id) || m;
  }

  private recalcularPago() {
    let total = 0;
    let granularidad = 0; // suma de cotizaciones de líneas extranjeras = residuo Fx máximo inevitable
    for (const l of this.lineas) {
      l.convertido = this.round((l.monto || 0) * (l.cotizacion || 0), this.monedaDeuda);
      total += l.convertido;
      if (l.necesitaCotizacion) granularidad += (l.cotizacion || 0);
    }
    this.totalPago = this.round(total, this.monedaDeuda);
    this.faltantePago = this.round(this.totalDeuda - this.totalPago, this.monedaDeuda);
    this.chequesList = this.lineas.filter(l => l.esCheque);
    this.hayCheques = this.chequesList.length > 0;

    const absFalt = Math.abs(this.faltantePago);
    const tol = this.tolerancia();
    // Solo se ofrece ajuste para diferencias pequeñas (redondeo Fx), no para errores de carga.
    const maxAjuste = Math.max(granularidad, this.totalDeuda * 0.005);
    this.ajusteDisponible = this.lineas.length > 0 && absFalt > tol && absFalt <= maxAjuste;
    if (this.ajusteDisponible) {
      this.ajusteMonto = absFalt;
      this.ajusteTipo = this.faltantePago > 0 ? 'DESCUENTO' : 'AUMENTO';
    } else {
      this.ajusteAplicado = false;
      this.ajusteMonto = 0;
    }

    this.balanceOk = this.todas.some(r => r._sel)
      && this.lineas.length > 0
      && (absFalt <= tol || this.ajusteAplicado);
  }

  toggleAjuste() { this.ajusteAplicado = !this.ajusteAplicado; this.recalcularPago(); }
  setAjusteTipo(t: 'DESCUENTO' | 'AUMENTO') { this.ajusteTipo = t; }

  private tolerancia(): number {
    // Tolerancia ESTRICTA (antes escalaba con nº de líneas, dejando faltantes silenciosos):
    // Gs (sin decimales) < 1 unidad; con decimales, 0.05. El reparto exacto lo garantiza el true-up de distribuirFifo.
    return this.decimales(this.monedaDeuda) > 0 ? 0.05 : 0.5;
  }

  private round(valor: number, moneda: any, decOverride?: number): number {
    const dec = decOverride != null ? decOverride : this.decimales(moneda);
    const f = Math.pow(10, dec);
    return Math.round((valor || 0) * f) / f;
  }

  // ── Confirmar ──
  onSave() {
    const sel = this.todas.filter(r => r._sel);
    if (sel.length === 0) return this.err('Seleccione al menos una nota a pagar');
    if (this.lineas.length === 0) return this.err('Agregue al menos una forma de pago');
    for (const l of this.lineas) {
      if (!l.moneda) return this.err('Cada forma de pago debe tener moneda');
      if (l.fuente === 'CUENTA_BANCARIA' && !l.cuenta) return this.err('Seleccione la cuenta bancaria');
      if (!l.monto || l.monto <= 0) return this.err('Cada forma de pago debe tener un monto válido');
      if (l.necesitaCotizacion && (!l.cotizacion || l.cotizacion <= 0)) return this.err('Falta la cotización de una forma de pago');
    }
    if (!this.balanceOk) return this.err('El total de las formas de pago debe igualar el total a pagar');

    const pagos = this.distribuirFifo(sel);
    this.isSaving = true;
    // El modo VALES paga por valeId: el backend resuelve/crea la obligación de pago de cada vale
    // (los vales que vienen del mobile nacen sin ella) y delega en el mismo motor de pago.
    const pago$ = this.esRrhh
      ? this.pagarComprasService.onPagarRrhhMixto(
          pagos.map(p => ({
            concepto: this.conceptoRrhh!, documentoId: p.solicitudId, lineas: p.lineas,
          } as PagoRrhhConLineas)))
      : this.esVale
        ? this.pagarComprasService.onPagarValesMixto(
            pagos.map(p => ({ valeId: p.solicitudId, lineas: p.lineas } as ValeConLineas)))
        : this.pagarComprasService.onPagarMixto(pagos);
    pago$.pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        if (res != null) { this.notificacion.openSucess('Pago registrado correctamente'); this.dialogRef.close(res); }
      },
      error: err => {
        this.isSaving = false;
        const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Error al registrar el pago';
        this.notificacion.openWarn(msg, 6);
      }
    });
  }

  /** Reparte las líneas (en la moneda de la deuda) entre las notas en orden (FIFO). Una línea puede partirse. */
  private distribuirFifo(sel: SolicitudRow[]): SolicitudConLineas[] {
    const pagosMap = new Map<number, LineaPagoInput[]>();
    const notas = sel.map(s => ({ id: s.id, rem: s._montoAPagar }));
    // El ajuste se imputa a la última nota: descuento reduce su parte física, aumento la incrementa.
    if (this.ajusteAplicado && this.ajusteMonto > 0 && notas.length > 0) {
      const last = notas[notas.length - 1];
      const signed = this.ajusteTipo === 'DESCUENTO' ? this.ajusteMonto : -this.ajusteMonto;
      last.rem = this.round(last.rem - signed, this.monedaDeuda);
    }
    const lns = this.lineas.map(l => ({ l, remConv: l.convertido }));
    let li = 0;
    for (const nota of notas) {
      let need = nota.rem;
      while (need > this.tolerancia() && li < lns.length) {
        const cur = lns[li];
        const takeConv = Math.min(need, cur.remConv);              // en moneda de la deuda
        const montoLinea = this.round(takeConv / (cur.l.cotizacion || 1), cur.l.moneda); // en moneda de la línea
        const esCheque = cur.l.fuente === 'CHEQUE';
        const parte: LineaPagoInput = {
          fuente: cur.l.fuente,
          cajaVirtualId: cur.l.fuente === 'CAJA_MAYOR' ? this.data.cajaVirtual?.id : undefined,
          cuentaBancariaId: (cur.l.fuente === 'CUENTA_BANCARIA' || esCheque) ? cur.l.cuenta?.id : undefined,
          monedaId: cur.l.moneda!.id,
          monto: montoLinea,
          cotizacion: cur.l.cotizacion,
          montoSolicitud: this.round(takeConv, this.monedaDeuda),
        };
        if (esCheque) {
          // 1 cheque por chequeRef aunque el FIFO lo reparta entre notas.
          parte.chequeRef = cur.l.chequeRef;
          parte.chequeraId = cur.l.chequeraId;
          parte.diferido = cur.l.diferido;
          parte.nominal = cur.l.nominal;
          parte.beneficiario = cur.l.beneficiario;
          parte.fechaEmision = cur.l.fechaEmision;
          parte.fechaPago = cur.l.fechaPago;
        }
        const arr = pagosMap.get(nota.id) || [];
        arr.push(parte);
        pagosMap.set(nota.id, arr);
        need -= takeConv;
        cur.remConv -= takeConv;
        if (cur.remConv <= this.tolerancia()) li++;
      }
    }
    // True-up: garantizar que Σ montoSolicitud de cada nota == su rem exactamente (evita que la
    // solicitud quede PARCIAL por un residuo de redondeo). La diferencia (siempre < tolerancia) se
    // absorbe en la última parte de esa nota; queda dentro de la tolerancia de consistencia del backend.
    for (const nota of notas) {
      const parts = pagosMap.get(nota.id);
      if (!parts || parts.length === 0) continue;
      const suma = parts.reduce((s, p) => s + (p.montoSolicitud || 0), 0);
      const diff = this.round(nota.rem - suma, this.monedaDeuda);
      if (Math.abs(diff) > 1e-9) {
        const last = parts[parts.length - 1];
        last.montoSolicitud = this.round((last.montoSolicitud || 0) + diff, this.monedaDeuda);
      }
    }
    // Línea de ajuste (diferencia de cambio) en la última nota: no mueve efectivo.
    if (this.ajusteAplicado && this.ajusteMonto > 0 && notas.length > 0) {
      const lastId = notas[notas.length - 1].id;
      const arr = pagosMap.get(lastId) || [];
      arr.push({
        fuente: 'AJUSTE',
        monedaId: this.monedaDeuda!.id,
        monto: 0,
        cotizacion: 1,
        montoSolicitud: this.round(this.ajusteMonto, this.monedaDeuda),
        descuento: this.ajusteTipo === 'DESCUENTO',
        aumento: this.ajusteTipo === 'AUMENTO',
      });
      pagosMap.set(lastId, arr);
    }
    return Array.from(pagosMap.entries()).map(([solicitudId, lineas]) => ({ solicitudId, lineas }));
  }

  /** Stub de impresión de cheques (D6): abre el flujo de impresión — el formato se define en otra iteración. */
  imprimirCheques() {
    this.notificacion.openWarn('Impresión de cheques: pendiente de implementar (el pago se registra igual).', 4);
  }

  private err(msg: string) { this.notificacion.openAlgoSalioMal(msg); }
  onCancel() { this.dialogRef.close(null); }
}
