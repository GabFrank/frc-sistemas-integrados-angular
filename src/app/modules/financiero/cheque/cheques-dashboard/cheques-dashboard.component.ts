import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Tab } from '../../../../layouts/tab/tab.model';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { EmitirChequeDialogComponent } from '../emitir-cheque-dialog/emitir-cheque-dialog.component';
import { GestionarChequerasDialogComponent } from '../../chequera/gestionar-chequeras-dialog/gestionar-chequeras-dialog.component';
import { dateToString, stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { MotivoDialogComponent, MotivoDialogData } from '../../../../shared/components/motivo-dialog/motivo-dialog.component';
import { CrearExcelService } from '../../../../shared/crear-excel/crear-excel.service';
import { NumeracionChequeraService } from '../../chequera/numeracion-chequera.service';
import { DetalleMovimientoDialogComponent, DetalleMovimientoDialogData } from '../../caja-virtual/detalle-movimiento-dialog/detalle-movimiento-dialog.component';
import { DetallePagoDialogComponent, DetallePagoDialogData } from '../../caja-virtual/detalle-pago-dialog/detalle-pago-dialog.component';
import { ChequeService } from '../cheque.service';
import { Cheque, ChequeResumenDia, ChequeSaldoChequera, EstadoCheque } from '../cheque.model';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';

// Fila de la tabla con campos de display precalculados (sin funciones en el template).
interface ChequeRow extends Cheque {
  _cobrable?: boolean;
  _anulable?: boolean;
  _monedaSimbolo?: string;
  _cuentaLabel?: string;
  _chequeraNombre?: string;
  _esFoco?: boolean;           // pertenece al día enfocado por el KPI
  _beneficiario?: string;      // el beneficiario, o el proveedor si no hay
  _origenLabel?: string;       // «Manual» o «Pago #N»
  _usuario?: string;
  _fechaEmision?: Date;        // fecha de emisión, o creación si no la tiene
  _motivoNoAnulable?: string | null;
  /** Fila de un número inutilizado, no de un cheque: sin acciones. */
  _inutilizado?: boolean;
}

/** Estados del filtro (desk #708): «Pendientes» son los que todavía no se debitaron. */
type FiltroEstado = 'TODOS' | 'PENDIENTES' | 'COBRADOS' | 'ANULADOS' | 'INUTILIZADOS';
const ESTADOS_DE_FILTRO: Record<FiltroEstado, EstadoCheque[]> = {
  TODOS: [],
  PENDIENTES: [EstadoCheque.DIFERIDO, EstadoCheque.EMITIDO],
  COBRADOS: [EstadoCheque.COBRADO],
  ANULADOS: [EstadoCheque.ANULADO],
  INUTILIZADOS: [],
};

interface ChequeraOpcion { id: number; label: string; }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-cheques-dashboard',
  templateUrl: './cheques-dashboard.component.html',
  styleUrls: ['./cheques-dashboard.component.scss'],
})
export class ChequesDashboardComponent implements OnInit {

  @Input() data: Tab;

  // ── Filtro (header) ──
  desdeControl = new FormControl();
  hastaControl = new FormControl();
  // Foco del KPI: un rango (desde/hasta). Si es un solo día, desde == hasta.
  focoDesdeControl = new FormControl();
  focoHastaControl = new FormControl();
  chequeraSel: number | null = null;
  /** Por defecto, «Emitidos hoy»: todos los estados por fecha de emisión (desk #708). */
  estadoSel: FiltroEstado = 'TODOS';
  tipoFechaSel: 'EMISION' | 'PAGO' | 'COBRO' = 'EMISION';
  textoControl = new FormControl('');

  estados: { label: string; value: FiltroEstado }[] = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Pendientes (diferidos y al día sin cobrar)', value: 'PENDIENTES' },
    { label: 'Cobrados', value: 'COBRADOS' },
    { label: 'Anulados', value: 'ANULADOS' },
    // Los números inutilizados vigentes de todas las chequeras (central #603): para que el control de la chequera
    // no tenga huecos sin explicar.
    { label: 'Números inutilizados', value: 'INUTILIZADOS' },
  ];
  tiposFecha = [
    { label: 'Emisión', value: 'EMISION' },
    { label: 'Pago (vencimiento)', value: 'PAGO' },
    { label: 'Cobro', value: 'COBRO' },
  ];

  chequeraOpciones: ChequeraOpcion[] = [];

  // ── Datos ──
  saldos: ChequeSaldoChequera[] = [];
  resumen: ChequeResumenDia[] = [];
  chequesFull: ChequeRow[] = [];   // lista completa del rango (la tabla puede filtrarse por día enfocado)
  dataSource = new MatTableDataSource<ChequeRow>([]);
  displayedColumns = ['numero', 'chequera', 'beneficiario', 'concepto', 'origen', 'fechaEmision', 'fechaPago', 'estado',
    'usuario', 'monto', 'acciones'];
  isLoading = false;
  /**
   * Alguna de las tres lecturas (lista, resumen, saldos) falló: lo que se ve puede ser de antes. Antes quedaba
   * «cargando» con los datos viejos y sin aviso (#390).
   */
  lecturaFallo = false;
  private fallos = { lista: false, resumen: false, saldos: false };
  /** Número de la última lectura de cada tipo: una respuesta vieja (dos recargas seguidas) no pisa a la nueva. */
  private seq = { lista: 0, resumen: 0, saldos: 0 };
  /** Cheques con un cobro o una anulación en curso: sin acciones hasta que termine (las filas se rearman al releer). */
  private chequesEnCurso = new Set<number>();

  // ── Consolidado (card "Posición general") ──
  consolidadoPendiente = 0;
  consolidadoSaldo = 0;
  consolidadoReservado = 0;
  consolidadoDisponible = 0;

  // ── KPI "a pagar en la fecha/rango" ──
  kpiLabel = 'Total del filtro';
  kpiTotal = 0;
  kpiCantidad = 0;

  puedeGestionar = false;

  estadoLabels: Record<string, string> = {
    DIFERIDO: 'Diferido', EMITIDO: 'Al día, sin cobrar', COBRADO: 'Cobrado', ANULADO: 'Anulado', INUTILIZADO: 'Inutilizado',
  };

  constructor(
    private chequeService: ChequeService,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
    private dialog: MatDialog,
    public mainService: MainService,
    private crearExcel: CrearExcelService,
    private numeracion: NumeracionChequeraService,
  ) {}

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    // Default: hoy por fecha de emisión, todos los estados («Emitidos hoy», desk #708).
    const hoy = new Date();
    this.desdeControl.setValue(hoy);
    this.hastaControl.setValue(hoy);
    this.recargar();
  }

  // ── Rango: strings para el backend (hasta = fin de día inclusivo) ──
  private get desdeStr(): string {
    const d = this.desdeControl.value;
    return d ? dateToString(d, 'yyyy-MM-dd') + ' 00:00' : null;
  }
  private get hastaStr(): string {
    const d = this.hastaControl.value;
    return d ? dateToString(d, 'yyyy-MM-dd') + ' 23:59' : null;
  }

  recargar() {
    this.cargarSaldos();
    this.cargarLista();
    this.cargarResumen();
  }

  // Presets de rango por fecha de pago.
  preset(tipo: 'hoy' | 'semana' | 'mes' | 'p30' | 'p60') {
    const hoy = new Date();
    if (tipo === 'hoy') {
      this.desdeControl.setValue(hoy);
      this.hastaControl.setValue(hoy);
    } else if (tipo === 'semana') {
      this.desdeControl.setValue(hoy);
      this.hastaControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7));
    } else if (tipo === 'mes') {
      this.desdeControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
      this.hastaControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
    } else if (tipo === 'p30') {
      this.desdeControl.setValue(hoy);
      this.hastaControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 30));
    } else if (tipo === 'p60') {
      this.desdeControl.setValue(hoy);
      this.hastaControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 60));
    }
    this.limpiarFoco();
    this.recargar();
  }

  aplicarFiltros() {
    this.recargar();
  }

  /** Restablece los filtros al de por defecto («Emitidos hoy») y quita el foco del día. */
  limpiarFiltros() {
    const hoy = new Date();
    this.desdeControl.setValue(hoy);
    this.hastaControl.setValue(hoy);
    this.chequeraSel = null;
    this.estadoSel = 'TODOS';
    this.tipoFechaSel = 'EMISION';
    this.textoControl.setValue('');
    this.focoDesdeControl.setValue(null);
    this.focoHastaControl.setValue(null);
    this.recargar();
  }

  onEstadoChange(v: FiltroEstado) {
    this.estadoSel = v;
    this.recargar();
  }

  onTipoFechaChange(v: 'EMISION' | 'PAGO' | 'COBRO') {
    this.tipoFechaSel = v;
    this.limpiarFoco();
    this.recargar();
  }

  /** Lo que la lista y el resumen mandan al central. */
  private filtroActual() {
    return {
      desde: this.desdeStr, hasta: this.hastaStr,
      chequeraId: this.chequeraSel || undefined,
      tipoFecha: this.tipoFechaSel,
      estados: ESTADOS_DE_FILTRO[this.estadoSel],
      texto: this.textoControl.value || null,
    };
  }

  onChequeraChange(v: number | null) {
    this.chequeraSel = v;
    this.cargarLista();
    this.cargarResumen();
  }

  // ── Cargas ──

  cargarSaldos() {
    // Los cards del sidebar muestran siempre lo pendiente (diferidos y al día sin cobrar: el central lo suma sin
    // estado), independiente del estado filtrado en la tabla.
    const n = ++this.seq.saldos;
    this.chequeService.onGetSaldosPorChequera(this.hastaStr, null)
      .pipe(untilDestroyed(this)).subscribe({
        next: res => {
          if (n !== this.seq.saldos) return;
          this.marcarLectura('saldos', false);
          this.saldos = res || [];
          this.chequeraOpciones = this.saldos
            .filter(s => s.chequera)
            .map(s => ({ id: s.chequera.id, label: s.chequera.nombre || ('Chequera #' + s.chequera.id) }));
          this.consolidar();
        },
        error: () => { if (n === this.seq.saldos) this.marcarLectura('saldos', true); },
      });
  }

  private marcarLectura(cual: 'lista' | 'resumen' | 'saldos', fallo: boolean) {
    this.fallos[cual] = fallo;
    this.lecturaFallo = this.fallos.lista || this.fallos.resumen || this.fallos.saldos;
  }

  cargarLista() {
    this.isLoading = true;
    const n = ++this.seq.lista;
    if (this.estadoSel === 'INUTILIZADOS') { this.cargarInutilizados(n); return; }
    this.chequeService.onGetChequesDashboard(this.filtroActual()).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        if (n !== this.seq.lista) return;
        this.isLoading = false;
        this.marcarLectura('lista', false);
        this.chequesFull = (res || []).map(c => this.toRow(c));
        this.aplicarFocoALista();
      },
      error: () => {
        if (n !== this.seq.lista) return;
        this.isLoading = false;
        this.marcarLectura('lista', true);
      },
    });
  }

  cargarResumen() {
    const n = ++this.seq.resumen;
    // Un número inutilizado no tiene monto: el KPI no suma nada.
    if (this.estadoSel === 'INUTILIZADOS') { this.resumen = []; this.recalcularKpi(); return; }
    this.chequeService.onGetResumenPorDia(this.filtroActual()).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        if (n !== this.seq.resumen) return;
        this.marcarLectura('resumen', false);
        this.resumen = res || [];
        this.recalcularKpi();
      },
      error: () => { if (n === this.seq.resumen) this.marcarLectura('resumen', true); },
    });
  }

  /** Los inutilizados vigentes, como filas del tablero (estado «Inutilizado»), filtrados por chequera. */
  private cargarInutilizados(n: number) {
    this.numeracion.onGetInutilizados(null).pipe(untilDestroyed(this)).subscribe(lista => {
      if (n !== this.seq.lista) return;
      this.isLoading = false;
      this.marcarLectura('lista', false);
      this.chequesFull = lista
        .filter(i => !this.chequeraSel || i.chequera?.id === this.chequeraSel)
        .map(i => ({
          id: -i.id, numero: i.numero, estado: 'INUTILIZADO', concepto: i.motivo, total: null,
          _chequeraNombre: i.chequera?.nombre || ('Chequera #' + i.chequera?.id), _cuentaLabel: '',
          _beneficiario: '', _origenLabel: 'Inutilizado', _usuario: i.usuario?.persona?.nombre || '',
          _fechaEmision: i.creadoEn, _inutilizado: true, _cobrable: false, _anulable: false, _monedaSimbolo: '',
        } as any as ChequeRow));
      this.aplicarFocoALista();
    });
  }

  private toRow(c: Cheque): ChequeRow {
    // Apollo congela los resultados (dev): clonar antes de agregar props de display,
    // si no, asignar sobre el objeto congelado lanza TypeError en modo estricto.
    const row = { ...c } as ChequeRow;
    const libre = !this.chequesEnCurso.has(c.id);
    const pendiente = c.estado === EstadoCheque.DIFERIDO || c.estado === EstadoCheque.EMITIDO;
    row._cobrable = libre && this.puedeGestionar && pendiente;
    // Un cheque de un pago se anula anulando el pago (el central también lo rechaza).
    row._motivoNoAnulable = c.pagoId ? `Es del pago #${c.pagoId}: anulá el pago desde la caja mayor.` : null;
    row._anulable = libre && this.puedeGestionar && pendiente && !c.pagoId;
    row._beneficiario = c.beneficiario || c.proveedor?.persona?.nombre || '';
    row._origenLabel = c.pagoId ? `Pago #${c.pagoId}` : 'Manual';
    row._usuario = c.usuario?.persona?.nombre || '';
    row._fechaEmision = c.fechaEntrega || c.creadoEn;
    row._monedaSimbolo = c.moneda?.simbolo || '';
    const banco = c.cuentaBancaria?.banco?.nombre || '';
    row._cuentaLabel = banco ? (banco + ' · ' + (c.cuentaBancaria?.numero || '')) : '';
    row._chequeraNombre = c.chequera?.nombre || (c.chequera ? 'Chequera #' + c.chequera.id : '');
    return row;
  }

  private consolidar() {
    this.consolidadoPendiente = this.saldos.reduce((a, s) => a + (s.pendienteHastaFecha || 0), 0);
    this.consolidadoSaldo = this.saldos.reduce((a, s) => a + (s.saldoCuenta || 0), 0);
    this.consolidadoReservado = this.saldos.reduce((a, s) => a + (s.saldoReservado || 0), 0);
    this.consolidadoDisponible = this.consolidadoSaldo - this.consolidadoPendiente;
  }

  // ── KPI / foco de día / gráfico ──

  private get focoDesdeStr(): string | null {
    return this.focoDesdeControl.value ? dateToString(this.focoDesdeControl.value, 'yyyy-MM-dd') : null;
  }
  // Si solo hay "desde", el foco es de un solo día (hasta = desde).
  private get focoHastaStr(): string | null {
    const d = this.focoDesdeStr;
    if (!d) return null;
    return this.focoHastaControl.value ? dateToString(this.focoHastaControl.value, 'yyyy-MM-dd') : d;
  }

  /** True si la fecha (yyyy-MM-dd) cae dentro del foco. Comparación lexicográfica = cronológica. */
  private enFoco(fecha: string): boolean {
    const d = this.focoDesdeStr;
    if (!d) return false;
    return fecha >= d && fecha <= this.focoHastaStr;
  }

  /** Aplica el foco (día o rango) a KPI y lista (foco null = rango completo). */
  private aplicarFoco() {
    this.recalcularKpi();
    this.aplicarFocoALista();
  }

  limpiarFoco() {
    this.focoDesdeControl.setValue(null);
    this.focoHastaControl.setValue(null);
    this.aplicarFoco();
  }

  private recalcularKpi() {
    const verbo = this.tipoFechaSel === 'EMISION' ? 'Emitido' : (this.tipoFechaSel === 'COBRO' ? 'Cobrado' : 'A pagar');
    const d = this.focoDesdeStr;
    if (d) {
      const h = this.focoHastaStr;
      this.kpiLabel = d === h
        ? `${verbo} el ${this.labelDia(d)}`
        : `${verbo} del ${this.labelDia(d)} al ${this.labelDia(h)}`;
      const items = this.resumen.filter(r => r.fecha >= d && r.fecha <= h);
      this.kpiTotal = items.reduce((a, r) => a + (r.total || 0), 0);
      this.kpiCantidad = items.reduce((a, r) => a + (r.cantidad || 0), 0);
    } else {
      this.kpiLabel = 'Total del filtro';
      this.kpiTotal = this.resumen.reduce((a, r) => a + (r.total || 0), 0);
      this.kpiCantidad = this.resumen.reduce((a, r) => a + (r.cantidad || 0), 0);
    }
  }

  /** Con un foco activo la tabla muestra solo ese día/rango; sin foco, todo el rango. */
  private aplicarFocoALista() {
    const activo = !!this.focoDesdeStr;
    const filas = activo
      ? this.chequesFull.filter(r => { const f = this.diaDe(this.fechaDelFiltro(r)); return f && this.enFoco(f); })
      : this.chequesFull;
    for (const row of filas) row._esFoco = activo;
    this.dataSource.data = filas;
  }

  /** La fecha de la fila que corresponde al tipo de fecha filtrado. */
  private fechaDelFiltro(r: ChequeRow): any {
    return this.tipoFechaSel === 'EMISION' ? r._fechaEmision : (this.tipoFechaSel === 'COBRO' ? r.fechaCobro : r.fechaPago);
  }

  private diaDe(fecha: any): string | null {
    return fecha ? dateToString(new Date(fecha), 'yyyy-MM-dd') : null;
  }

  private labelDia(fecha: string): string {
    const p = fecha.split('-');   // yyyy-MM-dd → dd/MM
    return p.length === 3 ? `${p[2]}/${p[1]}` : fecha;
  }

  // ── Acciones ──

  onEmitirCheque() {
    this.dialog.open(EmitirChequeDialogComponent, { width: '640px', maxWidth: '95vw', maxHeight: '92vh' })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res) this.recargar(); });
  }

  onGestionarChequeras() {
    // Alto fijo: el diálogo no crece con la cantidad de chequeras (scroll interno).
    this.dialog.open(GestionarChequerasDialogComponent, { width: '880px', height: '600px', maxWidth: '95vw', maxHeight: '92vh' })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res) this.recargar(); });
  }

  onCobrar(cheque: ChequeRow) {
    if (!cheque?.id) return;
    this.dialogosService.confirm(
      'Cobrar cheque',
      '¿Confirmar el cobro de este cheque? Se debitará el saldo de la cuenta y se liberará la reserva.',
      'Nº ' + (cheque.numero || '') + ' · ' + (cheque._monedaSimbolo || '') + ' ' + (cheque.total || 0),
      null, true, 'Sí, cobrar', 'No',
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res !== true) return;
      this.ejecutar(cheque.id, this.chequeService.onCobrar(cheque.id), 'Cheque cobrado');
    });
  }

  /** Anula pidiendo el motivo (desk #708: antes iba fijo «Anulado desde dashboard»). */
  onAnular(cheque: ChequeRow) {
    if (!cheque?.id) return;
    const data: MotivoDialogData = {
      titulo: 'Anular cheque',
      mensaje: 'Nº ' + (cheque.numero || '') + ' · ' + (cheque._monedaSimbolo || '') + ' '
        + (cheque.total || 0).toLocaleString('es-PY') + (cheque._beneficiario ? ' · ' + cheque._beneficiario : ''),
      detalle: 'Se libera lo reservado en la cuenta: el cheque deja de estar pendiente.',
      etiqueta: 'Motivo de la anulación',
      botonConfirmar: 'Anular',
    };
    this.dialog.open(MotivoDialogComponent, { data, width: '520px', maxWidth: '95vw' }).afterClosed()
      .pipe(untilDestroyed(this)).subscribe((motivo: string | null) => {
        if (!motivo) return;
        this.ejecutar(cheque.id, this.chequeService.onAnular(cheque.id, motivo), 'Cheque anulado');
      });
  }

  /** Detalle del cheque; si salió de un pago, el desglose del pago. */
  onVerDetalle(cheque: ChequeRow) {
    if (cheque.pagoId) {
      const data: DetallePagoDialogData = { pagoId: cheque.pagoId, descripcion: 'Cheque Nº ' + (cheque.numero || '') };
      this.dialog.open(DetallePagoDialogComponent, { width: '65vw', maxWidth: '95vw', height: '70vh', data });
      return;
    }
    const f = (d: any) => d ? dateToString(new Date(d), 'dd/MM/yyyy') : '—';
    const data: DetalleMovimientoDialogData = {
      titulo: 'Cheque Nº ' + (cheque.numero || ''),
      subtitulo: cheque._chequeraNombre + (cheque._cuentaLabel ? ' · ' + cheque._cuentaLabel : ''),
      datos: [
        { etiqueta: 'Beneficiario', valor: cheque._beneficiario || '—' },
        { etiqueta: 'Monto', valor: (cheque._monedaSimbolo || '') + ' ' + (cheque.total || 0).toLocaleString('es-PY') },
        { etiqueta: 'Nominal', valor: cheque.nominal === false ? 'Al portador' : 'Nominal' },
        { etiqueta: 'Emisión', valor: f(cheque._fechaEmision) },
        { etiqueta: 'Pago', valor: f(cheque.fechaPago) },
        { etiqueta: 'Cobro', valor: f(cheque.fechaCobro) },
        { etiqueta: 'Estado', valor: this.estadoLabels[cheque.estado] || String(cheque.estado || '') },
        { etiqueta: 'Concepto', valor: cheque.concepto || '—' },
        { etiqueta: 'Usuario', valor: cheque._usuario || '—' },
        ...(cheque.motivoAnulacion ? [{ etiqueta: 'Motivo de anulación', valor: cheque.motivoAnulacion }] : []),
      ],
    };
    this.dialog.open(DetalleMovimientoDialogComponent, { width: '520px', maxWidth: '95vw', maxHeight: '80vh', data });
  }

  /** Exporta la lista filtrada (la que se ve) a Excel. */
  onExportar() {
    const f = (d: any) => d ? dateToString(new Date(d), 'dd/MM/yyyy') : '';
    const filas = this.dataSource.data.map(c => [
      c.numero, c._chequeraNombre, c._cuentaLabel, c._beneficiario, c.concepto || '', c._origenLabel,
      f(c._fechaEmision), f(c.fechaPago), f(c.fechaCobro), this.estadoLabels[c.estado] || c.estado, c._usuario,
      c._monedaSimbolo, c.total,
    ]);
    const encabezado = ['Nº', 'Chequera', 'Cuenta', 'Beneficiario', 'Concepto', 'Origen', 'Emisión', 'Pago', 'Cobro',
      'Estado', 'Usuario', 'Moneda', 'Monto'];
    this.crearExcel.onCreateAndExport(encabezado, filas, 'Cheques ' + dateToString(new Date(), 'dd-MM-yyyy'));
  }

  /**
   * Cobra o anula y **relee siempre**: si se aplicó hay que mostrarlo, un rechazo («ya está cobrado») significa que
   * la lista estaba vieja, y sin respuesta es la única forma de saber (#390). Mientras dura, el cheque no ofrece
   * acciones.
   */
  private ejecutar(chequeId: number, obs: Observable<any>, exito: string) {
    if (this.chequesEnCurso.has(chequeId)) return;
    this.chequesEnCurso.add(chequeId);
    this.dataSource.data.forEach(r => { if (r.id === chequeId) { r._cobrable = false; r._anulable = false; } });
    const terminar = () => {
      this.chequesEnCurso.delete(chequeId);
      this.recargar();
    };
    obs.pipe(untilDestroyed(this)).subscribe({
      next: r => {
        if (r != null) {
          this.notificacion.notification$.next({ texto: exito, color: NotificacionColor.success, duracion: 3 });
        } else {
          this.avisarSinConfirmar();
        }
        terminar();
      },
      error: err => {
        const rechazo = erroresDeRechazo(err);
        if (rechazo) {
          const msg = rechazo[0]?.message || err?.message || 'No se pudo completar la operación';
          this.notificacion.notification$.next({ texto: msg, color: NotificacionColor.warn, duracion: 5 });
        } else if (!esTimeoutDeLink(err)) {
          // El corte del link ya avisó que pudo haberse aplicado.
          this.avisarSinConfirmar();
        }
        terminar();
      },
    });
  }

  private avisarSinConfirmar() {
    this.notificacion.notification$.next({
      texto: 'No se pudo confirmar la operación: se vuelve a leer la lista de cheques para verificarla.',
      color: NotificacionColor.warn, duracion: 6,
    });
  }
}
