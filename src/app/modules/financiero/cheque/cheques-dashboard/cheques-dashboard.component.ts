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
  _estadoColor?: string;       // fondo del chip de estado
  _estadoColorTexto?: string;  // texto claro del monto (contraste AA sobre fondo oscuro)
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
  focoControl = new FormControl();          // día puntual para el KPI (opcional)
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

  // ── KPI "a pagar en la fecha" ──
  kpiEsRango = true;         // true = total del rango; false = un día enfocado
  kpiFecha: string | null = null;
  kpiTotal = 0;
  kpiCantidad = 0;

  puedeGestionar = false;

  // Colores de estado (fondo saturado del chip + texto claro AA para el monto).
  private estadoColores: Record<string, string> = {
    DIFERIDO: '#ff9800', EMITIDO: '#2196f3', COBRADO: '#4caf50', ANULADO: '#757575',
  };
  private estadoColoresTexto: Record<string, string> = {
    DIFERIDO: '#ffb74d', EMITIDO: '#64b5f6', COBRADO: '#81c784', ANULADO: '#bdbdbd',
  };
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
  preset(tipo: 'hoy' | 'mes' | 'p30' | 'p60') {
    const hoy = new Date();
    if (tipo === 'hoy') {
      this.desdeControl.setValue(hoy);
      this.hastaControl.setValue(hoy);
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
    const est = c.estado as any;
    row._estadoColor = this.estadoColores[est] || '#607d8b';
    row._estadoColorTexto = this.estadoColoresTexto[est] || '#b0bec5';
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

  private get focoStr(): string | null {
    return this.focoControl.value ? dateToString(this.focoControl.value, 'yyyy-MM-dd') : null;
  }

  /** Aplica el día enfocado a KPI, gráfico y lista (foco null = rango completo). */
  private aplicarFoco() {
    this.recalcularKpi();
    this.construirGrafico();
    this.aplicarFocoALista();
  }

  onFocoChange(d: Date | null) {
    this.aplicarFoco();
  }

  limpiarFoco() {
    this.focoControl.setValue(null);
    this.aplicarFoco();
  }

  /** Clic en una barra del gráfico: enfoca ese día (toggle si ya estaba enfocado). */
  onBarClick(e: any) {
    const dia = this.resumen[e?.dataIndex];
    if (!dia) return;
    const yaEnfocado = this.focoStr === dia.fecha;
    this.focoControl.setValue(yaEnfocado ? null : stringToLocalDate(dia.fecha));
    this.aplicarFoco();
  }

  private recalcularKpi() {
    const foco = this.focoStr;
    this.kpiFecha = foco;
    if (foco) {
      const dia = this.resumen.find(r => r.fecha === foco);
      this.kpiEsRango = false;
      this.kpiTotal = dia?.total || 0;
      this.kpiCantidad = dia?.cantidad || 0;
    } else {
      this.kpiEsRango = true;
      this.kpiTotal = this.resumen.reduce((a, r) => a + (r.total || 0), 0);
      this.kpiCantidad = this.resumen.reduce((a, r) => a + (r.cantidad || 0), 0);
    }
  }

  /** Con un día enfocado la tabla muestra solo ese día; sin foco, todo el rango. */
  private aplicarFocoALista() {
    const foco = this.focoStr;
    const filas = foco
      ? this.chequesFull.filter(r => this.diaDe(r.fechaPago) === foco)
      : this.chequesFull;
    for (const row of filas) row._esFoco = !!foco;
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
    const foco = this.focoStr;
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
          itemStyle: { color: (foco && d.fecha === foco) ? GRAFICO_COLORES.warning : GRAFICO_COLORES.info },
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
    this.dialog.open(GestionarChequerasDialogComponent, { width: '820px', maxWidth: '95vw', maxHeight: '90vh' })
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
