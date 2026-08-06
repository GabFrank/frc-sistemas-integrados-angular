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
import { EChartsOption } from 'echarts';
import { GRAFICO_COLORES, formatoEjeCompacto } from '../../../../shared/utils/grafico-echarts.theme';
import { ChequeService } from '../cheque.service';
import { Cheque, ChequeResumenDia, ChequeSaldoChequera, EstadoCheque } from '../cheque.model';

// Fila de la tabla con campos de display precalculados (sin funciones en el template).
interface ChequeRow extends Cheque {
  _cobrable?: boolean;
  _anulable?: boolean;
  _monedaSimbolo?: string;
  _cuentaLabel?: string;
  _chequeraNombre?: string;
  _esFoco?: boolean;           // pertenece al día enfocado por el KPI
}

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
  estadoSel: string | null = EstadoCheque.DIFERIDO;   // default: diferidos (pendientes)

  estados = [
    { label: 'Diferidos (pendientes)', value: EstadoCheque.DIFERIDO },
    { label: 'Emitidos', value: EstadoCheque.EMITIDO },
    { label: 'Cobrados', value: EstadoCheque.COBRADO },
    { label: 'Anulados', value: EstadoCheque.ANULADO },
    { label: 'Todos', value: null },
  ];

  chequeraOpciones: ChequeraOpcion[] = [];

  // ── Datos ──
  saldos: ChequeSaldoChequera[] = [];
  resumen: ChequeResumenDia[] = [];
  chequesFull: ChequeRow[] = [];   // lista completa del rango (la tabla puede filtrarse por día enfocado)
  dataSource = new MatTableDataSource<ChequeRow>([]);
  displayedColumns = ['numero', 'chequera', 'beneficiario', 'fechaEmision', 'fechaPago', 'estado', 'monto', 'acciones'];
  isLoading = false;

  // ── Gráfico (monto por día de pago) ──
  chartOptions: EChartsOption | null = null;
  hayDatosGrafico = false;

  // ── Consolidado (card "Posición general") ──
  consolidadoPendiente = 0;
  consolidadoSaldo = 0;
  consolidadoReservado = 0;
  consolidadoDisponible = 0;

  // ── KPI "a pagar en la fecha/rango" ──
  kpiLabel = 'Total del rango (por pagar)';
  kpiTotal = 0;
  kpiCantidad = 0;

  puedeGestionar = false;

  estadoLabels: Record<string, string> = {
    DIFERIDO: 'Diferido', EMITIDO: 'Emitido', COBRADO: 'Cobrado', ANULADO: 'Anulado',
  };

  constructor(
    private chequeService: ChequeService,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
    private dialog: MatDialog,
    public mainService: MainService,
  ) {}

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    // Default: mes actual.
    const hoy = new Date();
    this.desdeControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.hastaControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
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

  /** Restablece todos los filtros a su estado por defecto (mes actual, todas las chequeras,
   *  diferidos) y quita el foco del día. */
  limpiarFiltros() {
    const hoy = new Date();
    this.desdeControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.hastaControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
    this.chequeraSel = null;
    this.estadoSel = EstadoCheque.DIFERIDO;
    this.focoDesdeControl.setValue(null);
    this.focoHastaControl.setValue(null);
    this.recargar();
  }

  onEstadoChange(v: string | null) {
    this.estadoSel = v;
    this.recargar();
  }

  onChequeraChange(v: number | null) {
    this.chequeraSel = v;
    this.cargarLista();
    this.cargarResumen();
  }

  // ── Cargas ──

  cargarSaldos() {
    // Los cards del sidebar muestran siempre los DIFERIDO pendientes (compromiso futuro),
    // independiente del estado filtrado en la tabla.
    this.chequeService.onGetSaldosPorChequera(this.hastaStr, EstadoCheque.DIFERIDO)
      .pipe(untilDestroyed(this)).subscribe(res => {
        this.saldos = res || [];
        this.chequeraOpciones = this.saldos
          .filter(s => s.chequera)
          .map(s => ({ id: s.chequera.id, label: s.chequera.nombre || ('Chequera #' + s.chequera.id) }));
        this.consolidar();
      });
  }

  cargarLista() {
    this.isLoading = true;
    this.chequeService.onGetChequesDashboard({
      desde: this.desdeStr, hasta: this.hastaStr,
      chequeraId: this.chequeraSel || undefined,
      estado: (this.estadoSel as EstadoCheque) || null,
    }).pipe(untilDestroyed(this)).subscribe(res => {
      this.isLoading = false;
      this.chequesFull = (res || []).map(c => this.toRow(c));
      this.aplicarFocoALista();
    });
  }

  cargarResumen() {
    this.chequeService.onGetResumenPorDia({
      desde: this.desdeStr, hasta: this.hastaStr,
      chequeraId: this.chequeraSel || undefined,
      estado: (this.estadoSel as EstadoCheque) || null,
    }).pipe(untilDestroyed(this)).subscribe(res => {
      this.resumen = res || [];
      this.recalcularKpi();
      this.construirGrafico();
    });
  }

  private toRow(c: Cheque): ChequeRow {
    // Apollo congela los resultados (dev): clonar antes de agregar props de display,
    // si no, asignar sobre el objeto congelado lanza TypeError en modo estricto.
    const row = { ...c } as ChequeRow;
    row._cobrable = this.puedeGestionar && c.estado === EstadoCheque.DIFERIDO;
    row._anulable = this.puedeGestionar && (c.estado === EstadoCheque.DIFERIDO || c.estado === EstadoCheque.EMITIDO);
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

  /** Aplica el foco (día o rango) a KPI, gráfico y lista (foco null = rango completo). */
  private aplicarFoco() {
    this.recalcularKpi();
    this.construirGrafico();
    this.aplicarFocoALista();
  }

  limpiarFoco() {
    this.focoDesdeControl.setValue(null);
    this.focoHastaControl.setValue(null);
    this.aplicarFoco();
  }

  /** Clic en una barra del gráfico: enfoca ese día puntual (toggle si ya era el único enfocado). */
  onBarClick(e: any) {
    const dia = this.resumen[e?.dataIndex];
    if (!dia) return;
    const yaSolo = this.focoDesdeStr === dia.fecha && this.focoHastaStr === dia.fecha;
    if (yaSolo) {
      this.focoDesdeControl.setValue(null);
      this.focoHastaControl.setValue(null);
    } else {
      const d = stringToLocalDate(dia.fecha);
      this.focoDesdeControl.setValue(d);
      this.focoHastaControl.setValue(d);
    }
    this.aplicarFoco();
  }

  private recalcularKpi() {
    const d = this.focoDesdeStr;
    if (d) {
      const h = this.focoHastaStr;
      this.kpiLabel = d === h
        ? `A pagar el ${this.labelDia(d)}`
        : `A pagar del ${this.labelDia(d)} al ${this.labelDia(h)}`;
      const items = this.resumen.filter(r => r.fecha >= d && r.fecha <= h);
      this.kpiTotal = items.reduce((a, r) => a + (r.total || 0), 0);
      this.kpiCantidad = items.reduce((a, r) => a + (r.cantidad || 0), 0);
    } else {
      this.kpiLabel = 'Total del rango (por pagar)';
      this.kpiTotal = this.resumen.reduce((a, r) => a + (r.total || 0), 0);
      this.kpiCantidad = this.resumen.reduce((a, r) => a + (r.cantidad || 0), 0);
    }
  }

  /** Con un foco activo la tabla muestra solo ese día/rango; sin foco, todo el rango. */
  private aplicarFocoALista() {
    const activo = !!this.focoDesdeStr;
    const filas = activo
      ? this.chequesFull.filter(r => { const f = this.diaDe(r.fechaPago); return f && this.enFoco(f); })
      : this.chequesFull;
    for (const row of filas) row._esFoco = activo;
    this.dataSource.data = filas;
  }

  private diaDe(fecha: any): string | null {
    return fecha ? dateToString(new Date(fecha), 'yyyy-MM-dd') : null;
  }

  private labelDia(fecha: string): string {
    const p = fecha.split('-');   // yyyy-MM-dd → dd/MM
    return p.length === 3 ? `${p[2]}/${p[1]}` : fecha;
  }

  private construirGrafico() {
    const dias = this.resumen;
    this.hayDatosGrafico = dias.length > 0;
    if (!this.hayDatosGrafico) { this.chartOptions = null; return; }
    this.chartOptions = {
      grid: { left: 58, right: 16, top: 20, bottom: dias.length > 12 ? 60 : 40 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: GRAFICO_COLORES.backgroundDark,
        borderColor: GRAFICO_COLORES.axisLine,
        textStyle: { color: GRAFICO_COLORES.text },
        formatter: (params: any) => {
          const i = Array.isArray(params) ? params[0]?.dataIndex : params?.dataIndex;
          const d = dias[i];
          if (!d) return '';
          return `${this.labelDia(d.fecha)}<br/>` +
                 `<b>${Number(d.total).toLocaleString('es-PY')}</b><br/>` +
                 `${d.cantidad} cheque(s)`;
        },
      },
      xAxis: {
        type: 'category',
        data: dias.map(d => this.labelDia(d.fecha)),
        axisLabel: { color: GRAFICO_COLORES.textSecondary, rotate: dias.length > 12 ? 45 : 0 },
        axisLine: { lineStyle: { color: GRAFICO_COLORES.axisLine } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: GRAFICO_COLORES.textSecondary, formatter: (v: number) => formatoEjeCompacto(v) },
        splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
      },
      series: [{
        type: 'bar',
        barMaxWidth: 44,
        cursor: 'pointer',
        data: dias.map(d => ({
          value: d.total,
          itemStyle: { color: this.enFoco(d.fecha) ? GRAFICO_COLORES.warning : GRAFICO_COLORES.info },
        })),
      }],
    };
  }

  // ── Acciones ──

  onEmitirCheque() {
    this.dialog.open(EmitirChequeDialogComponent, { width: '520px', maxWidth: '95vw', maxHeight: '92vh' })
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
      this.ejecutar(this.chequeService.onCobrar(cheque.id), 'Cheque cobrado');
    });
  }

  onAnular(cheque: ChequeRow) {
    if (!cheque?.id) return;
    this.dialogosService.confirm(
      'Anular cheque',
      '¿Anular este cheque? Si es diferido se libera la reserva; si ya debitó, se revierte el movimiento bancario.',
      'Nº ' + (cheque.numero || '') + ' · ' + (cheque._monedaSimbolo || '') + ' ' + (cheque.total || 0),
      null, true, 'Sí, anular', 'No',
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res !== true) return;
      this.ejecutar(this.chequeService.onAnular(cheque.id, 'Anulado desde dashboard'), 'Cheque anulado');
    });
  }

  private ejecutar(obs: Observable<any>, exito: string) {
    obs.pipe(untilDestroyed(this)).subscribe({
      next: r => {
        if (r != null) {
          this.notificacion.notification$.next({ texto: exito, color: NotificacionColor.success, duracion: 3 });
          this.recargar();
        }
      },
      error: err => {
        const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo completar la operación';
        this.notificacion.notification$.next({ texto: msg, color: NotificacionColor.warn, duracion: 5 });
      },
    });
  }
}
