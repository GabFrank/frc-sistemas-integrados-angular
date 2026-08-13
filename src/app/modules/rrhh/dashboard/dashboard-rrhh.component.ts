import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EChartsOption } from 'echarts';

import { Tab } from '../../../layouts/tab/tab.model';
import { TabService, TabData } from '../../../layouts/tab/tab.service';
import { LegajoFuncionarioComponent } from '../legajo/legajo-funcionario/legajo-funcionario.component';
import {
  formatoEjeCompacto,
  formatoMonedaPy,
  GRAFICO_COLORES,
} from '../../../shared/utils/grafico-echarts.theme';
import { DashRankingItem } from '../../../shared/components/dashboard/dash-ranking-list/dash-ranking-list.component';
import { DashboardRrhhService } from './dashboard-rrhh.service';
import { ReportesRrhhService } from '../reportes/reportes-rrhh.service';
import { ReporteService } from '../../reportes/reporte.service';
import { ReportesComponent } from '../../reportes/reportes/reportes.component';
import { NotificacionSnackbarService, NotificacionColor } from '../../../notificacion-snackbar.service';
import { ListLiquidacionComponent } from '../liquidacion/list-liquidacion/list-liquidacion.component';
import { ListValeComponent } from '../vale/list-vale/list-vale.component';
import { ListPrestamoComponent } from '../prestamo/list-prestamo/list-prestamo.component';

interface KpiVista {
  icon: string;
  color: string;
  label: string;
  value: string;
}

interface AccesoRapido {
  icon: string;
  title: string;
  color: string;
  action: () => void;
}

interface ReporteOpcion {
  titulo: string;
  icon: string;
  accion: string;
}

interface IncompletoVista {
  funcionarioId: number;
  nombre: string;
  detalle: string;
  score: number;
  porcentaje: number;
  critico: boolean;
}

/**
 * Dashboard del módulo de RRHH. Sigue el patrón de dashboards del sistema
 * (docs/DASHBOARDS.md): filtro de período → 4 KPIs → accesos → chart + listas.
 * Los valores se precalculan en el .ts (nunca se llaman funciones desde el HTML).
 */
@Component({
  selector: 'app-dashboard-rrhh',
  templateUrl: './dashboard-rrhh.component.html',
  styleUrls: ['./dashboard-rrhh.component.scss'],
})
export class DashboardRrhhComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cargando = false;

  // RRHH trabaja por período mensual (input type=month → 'YYYY-MM').
  periodo = '';

  kpis: KpiVista[] = [];
  accesos: AccesoRapido[] = [];

  // Chart: nómina por mes (últimos 12 meses, independiente del filtro).
  serieOpciones: EChartsOption | null = null;
  serieHayDatos = false;

  // Rankings (der).
  topExposicion: DashRankingItem[] = [];
  topHorasExtra: DashRankingItem[] = [];

  // Cumpleaños del mes (card lateral derecha, con scroll).
  cumpleanos: DashRankingItem[] = [];

  // Funcionarios con legajo incompleto (peores primero), paginado. Click → legajo.
  incompletos: IncompletoVista[] = [];
  incompletosPage = 0;
  incompletosSize = 8;
  incompletosTotal = 0;
  cargandoIncompletos = false;
  // Precalculados (no llamar funciones/getters desde el HTML).
  incompletosRangoTexto = '0 de 0';
  incompletosHayPrev = false;
  incompletosHayNext = false;

  // Reportes (mat-menu). Solo icono + título; generan PDF en el visor integrado.
  reportes: ReporteOpcion[] = [
    { titulo: 'Nómina del mes', icon: 'receipt_long', accion: 'nomina' },
    { titulo: 'Resumen IPS', icon: 'account_balance', accion: 'ips' },
    { titulo: 'Vales pendientes', icon: 'request_quote', accion: 'vales' },
    { titulo: 'Préstamos activos', icon: 'account_balance_wallet', accion: 'prestamos' },
    { titulo: 'Aguinaldo del año', icon: 'card_giftcard', accion: 'aguinaldo' },
  ];
  generandoReporte = false;

  private readonly TOP_N = 5;

  constructor(
    private tabService: TabService,
    private dashboardService: DashboardRrhhService,
    private reportesService: ReportesRrhhService,
    private reporteService: ReporteService,
    private notificacion: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.periodo = this.periodoActual();
    this.armarAccesos();
    this.cargar();
    this.cargarSerie();
    this.cargarIncompletos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    if (!this.periodo) return;
    this.cargando = true;

    this.dashboardService
      .onGetKpis(this.periodo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.cargando = false;
          this.armarKpis(r);
        },
        error: () => (this.cargando = false),
      });

    this.dashboardService
      .onGetTopExposicion(this.TOP_N)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.topExposicion = this.mapRankingMoneda(data || [], ' oblig.');
      });

    this.dashboardService
      .onGetTopHorasExtra(this.periodo, this.TOP_N)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.topHorasExtra = this.mapRankingMoneda(data || [], ' HE');
      });

    this.dashboardService
      .onGetCumpleanos(this.periodo)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.armarCumpleanos(data || []));
  }

  /** Serie por mes: últimos 12 meses hasta el período elegido. */
  private cargarSerie(): void {
    const [anio, mes] = this.periodo.split('-').map((x) => Number(x));
    const fin = new Date(anio, mes - 1, 1);
    const inicio = new Date(anio, mes - 12, 1);
    this.dashboardService
      .onGetSeriePorMes(this.aPeriodo(inicio), this.aPeriodo(fin))
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.armarSerie(data || []));
  }

  // ===== KPIs =====
  private armarKpis(r: any): void {
    r = r || {};
    const pendientes = r.liquidacionesPendientes || 0;
    const porVencer = r.vacacionesPorVencer || 0;
    this.kpis = [
      {
        icon: 'groups',
        color: 'info',
        label: 'Funcionarios activos',
        value: `${r.funcionariosActivos || 0}`,
      },
      {
        icon: 'payments',
        color: 'primary',
        label: 'Nómina del mes',
        value: formatoMonedaPy(r.nominaDelMes || 0),
      },
      {
        icon: 'pending_actions',
        color: pendientes > 0 ? 'warning' : 'primary',
        label: 'Liquidaciones pendientes',
        value: `${pendientes}`,
      },
      {
        icon: 'beach_access',
        color: porVencer > 0 ? 'warning' : 'primary',
        label: 'Vacaciones por vencer',
        value: `${porVencer}`,
      },
    ];
  }

  // ===== Rankings =====
  private mapRankingMoneda(
    rows: { nombre?: string; principal?: number; secundario?: number }[],
    sufijoSecundario: string
  ): DashRankingItem[] {
    const max = Math.max(1, ...rows.map((r) => r.principal || 0));
    return rows.map((r) => ({
      nombre: r.nombre || '—',
      valorPrincipal: formatoMonedaPy(r.principal || 0),
      valorSecundario: `${r.secundario || 0}${sufijoSecundario}`,
      porcentaje: ((r.principal || 0) / max) * 100,
    }));
  }

  private armarCumpleanos(
    data: { nombre?: string; dia?: number; cargo?: string }[]
  ): void {
    this.cumpleanos = data.map((c) => ({
      nombre: c.nombre || '—',
      valorPrincipal: `día ${c.dia || '—'}`,
      valorSecundario: c.cargo || '',
    }));
  }

  // ===== Funcionarios con legajo incompleto =====
  cargarIncompletos(): void {
    this.cargandoIncompletos = true;
    this.dashboardService
      .onGetFuncionariosIncompletos(this.incompletosPage, this.incompletosSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.cargandoIncompletos = false;
          this.armarIncompletos(res || {});
        },
        error: () => (this.cargandoIncompletos = false),
      });
  }

  private armarIncompletos(res: {
    total?: number;
    items?: { funcionarioId?: number; nombre?: string; cargo?: string; score?: number; faltantes?: string }[];
  }): void {
    this.incompletosTotal = res.total || 0;
    this.incompletos = (res.items || []).map((f) => ({
      funcionarioId: f.funcionarioId,
      nombre: f.nombre || '—',
      detalle: f.faltantes ? 'Falta: ' + f.faltantes : (f.cargo || ''),
      score: f.score || 1,
      porcentaje: (f.score || 1) * 10,
      critico: (f.score || 1) <= 3,
    }));
    const desde = this.incompletosTotal === 0 ? 0 : this.incompletosPage * this.incompletosSize + 1;
    const hasta = Math.min(this.incompletosTotal, (this.incompletosPage + 1) * this.incompletosSize);
    this.incompletosRangoTexto = `${desde}-${hasta} de ${this.incompletosTotal}`;
    this.incompletosHayPrev = this.incompletosPage > 0;
    this.incompletosHayNext = (this.incompletosPage + 1) * this.incompletosSize < this.incompletosTotal;
  }

  onIncompletosPrev(): void {
    if (!this.incompletosHayPrev) return;
    this.incompletosPage--;
    this.cargarIncompletos();
  }

  onIncompletosNext(): void {
    if (!this.incompletosHayNext) return;
    this.incompletosPage++;
    this.cargarIncompletos();
  }

  /** Abre el legajo del funcionario para completar los datos faltantes. */
  onAbrirLegajo(item: IncompletoVista): void {
    if (item.funcionarioId == null) return;
    this.tabService.addTab(new Tab(
      LegajoFuncionarioComponent,
      'Legajo — ' + item.nombre,
      new TabData(item.funcionarioId, { id: item.funcionarioId }),
      null
    ));
  }

  // ===== Chart =====
  private armarSerie(
    data: { periodo?: string; cantidad?: number; monto?: number }[]
  ): void {
    this.serieHayDatos = data.length > 0;
    if (!this.serieHayDatos) {
      this.serieOpciones = null;
      return;
    }
    const meses = data.map((d) => d.periodo || '');
    const montos = data.map((d) => d.monto || 0);
    const cantidades = data.map((d) => d.cantidad || 0);

    this.serieOpciones = {
      backgroundColor: 'transparent',
      grid: { top: 30, right: 50, bottom: 30, left: 55 },
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['Nómina', 'Liquidaciones'],
        textStyle: { color: GRAFICO_COLORES.textSecondary, fontSize: 13 },
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: meses,
        axisLabel: { color: GRAFICO_COLORES.textSecondary, fontSize: 13 },
        axisLine: { lineStyle: { color: GRAFICO_COLORES.axisLine } },
      },
      yAxis: [
        {
          type: 'value',
          axisLabel: {
            color: GRAFICO_COLORES.textSecondary,
            fontSize: 13,
            formatter: (v: number) => formatoEjeCompacto(v),
          },
          splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
        },
        {
          type: 'value',
          axisLabel: { color: GRAFICO_COLORES.textSecondary, fontSize: 13 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Nómina',
          type: 'bar',
          data: montos,
          itemStyle: {
            color: GRAFICO_COLORES.primary,
            borderRadius: [3, 3, 0, 0],
          },
          barMaxWidth: 28,
        },
        {
          name: 'Liquidaciones',
          type: 'line',
          yAxisIndex: 1,
          data: cantidades,
          smooth: true,
          symbolSize: 6,
          lineStyle: { color: GRAFICO_COLORES.accent, width: 2 },
          itemStyle: { color: GRAFICO_COLORES.accent },
        },
      ],
    };
  }

  // ===== Accesos rápidos =====
  private armarAccesos(): void {
    this.accesos = [
      {
        icon: 'receipt_long',
        title: 'Liquidaciones',
        color: '#4caf50',
        action: () => this.abrir(ListLiquidacionComponent, 'Liquidaciones'),
      },
      {
        icon: 'request_quote',
        title: 'Vales',
        color: '#2196f3',
        action: () => this.abrir(ListValeComponent, 'Vales'),
      },
      {
        icon: 'account_balance',
        title: 'Préstamos',
        color: '#ff9800',
        action: () => this.abrir(ListPrestamoComponent, 'Préstamos'),
      },
    ];
  }

  private abrir(component: any, title: string): void {
    this.tabService.addTab(new Tab(component, title, null, DashboardRrhhComponent));
  }

  // ===== Reportes (mat-menu) =====
  onReporte(accion: string): void {
    const necesitaPeriodo = accion === 'nomina' || accion === 'ips' || accion === 'aguinaldo';
    if (necesitaPeriodo && !this.periodo) {
      this.notificacion.notification$.next({
        texto: 'Seleccione el período', color: NotificacionColor.warn, duracion: 3,
      });
      return;
    }
    let obs;
    let nombre;
    switch (accion) {
      case 'nomina': obs = this.reportesService.onNominaMes(this.periodo); nombre = 'Nómina ' + this.periodo; break;
      case 'ips': obs = this.reportesService.onResumenIps(this.periodo); nombre = 'IPS ' + this.periodo; break;
      case 'vales': obs = this.reportesService.onValesPendientes(); nombre = 'Vales pendientes'; break;
      case 'prestamos': obs = this.reportesService.onPrestamosActivos(); nombre = 'Préstamos activos'; break;
      case 'aguinaldo': obs = this.reportesService.onAguinaldoAnual(Number(this.periodo.substring(0, 4))); nombre = 'Aguinaldo ' + this.periodo.substring(0, 4); break;
      default: return;
    }
    this.generandoReporte = true;
    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (base64: string) => {
        this.generandoReporte = false;
        this.mostrarPdf(nombre, base64);
      },
      error: () => (this.generandoReporte = false),
    });
  }

  /** Muestra el PDF en el visor integrado (window.open está bloqueado en Electron). */
  private mostrarPdf(nombre: string, base64: string): void {
    if (!base64) {
      this.notificacion.notification$.next({
        texto: 'No se pudo generar el reporte', color: NotificacionColor.warn, duracion: 3,
      });
      return;
    }
    this.reporteService.onAdd(nombre, base64);
    this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, null));
  }

  // ===== Utils (no se llaman desde el HTML) =====
  private periodoActual(): string {
    const hoy = new Date();
    return this.aPeriodo(hoy);
  }

  private aPeriodo(d: Date): string {
    return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`;
  }
}
