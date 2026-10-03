import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PROPAGAR_ERROR_DE_RED } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import { TesoreriaReporteService } from '../tesoreria-dashboard/tesoreria-reporte.service';
import { SaldoTesoreria, VencimientoTesoreria, AgingTesoreria } from '../tesoreria-dashboard/tesoreria-reporte.model';
import { CajaVirtual } from '../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual/caja-virtual.service';
import { TabService, TabData } from '../../../layouts/tab/tab.service';
import { Tab } from '../../../layouts/tab/tab.model';
import { CajaVirtualDashboardComponent } from '../caja-virtual/caja-virtual-dashboard/caja-virtual-dashboard.component';
import { ListCajaVirtualComponent } from '../caja-virtual/list-caja-virtual/list-caja-virtual.component';
import { ListOperacionFinancieraComponent } from '../operacion-financiera/list-operacion-financiera/list-operacion-financiera.component';
import { CuentaBancariaComponent } from '../cuenta-bancaria/cuenta-bancaria.component';
import { BancoComponent } from '../banco/banco.component';
import { MonedaComponent } from '../moneda/moneda.component';
import { ChequesDashboardComponent } from '../cheque/cheques-dashboard/cheques-dashboard.component';
import { MainService } from '../../../main.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { DashRankingItem } from '../../../shared/components/dashboard/dash-ranking-list/dash-ranking-list.component';
import { EChartsOption } from 'echarts';
import { GRAFICO_COLORES, formatoEjeCompacto } from '../../../shared/utils/grafico-echarts.theme';

const NO_DISPONIBLE = 'No disponible';

interface KpiItem { icon: string; color: string; label: string; value: string; }
interface AccesoItem { icon: string; title: string; color: string; accion: string; }
interface CajaCard { caja: CajaVirtual; saldoLabel: string; }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-financiero-dashboard',
  templateUrl: './financiero-dashboard.component.html',
  styleUrls: ['./financiero-dashboard.component.scss']
})
export class FinancieroDashboardComponent implements OnInit {

  cargando = false;

  kpis: KpiItem[] = [];
  vencimientoItems: DashRankingItem[] = [];
  cajaCards: CajaCard[] = [];
  /** Fuentes que no cargaron: la sección dice «No disponible» en vez de «no hay» (#390). */
  cajasNoCargadas = false;
  vencimientosNoCargados = false;

  // Gráfico: saldo por moneda (efectivo vs banco)
  serieOpciones: EChartsOption | null = null;
  serieHayDatos = false;

  accesos: AccesoItem[] = [
    { icon: 'sync_alt', title: 'Operaciones Financieras', color: '#6a1b9a', accion: 'operaciones' },
    { icon: 'menu_book', title: 'Cheques', color: '#4527a0', accion: 'cheques' },
    { icon: 'account_balance', title: 'Cuentas Bancarias', color: '#1565c0', accion: 'cuentas' },
    { icon: 'business', title: 'Bancos', color: '#00838f', accion: 'bancos' },
    { icon: 'paid', title: 'Monedas', color: '#2e7d32', accion: 'monedas' },
    { icon: 'account_balance_wallet', title: 'Todas las Cajas', color: '#e65100', accion: 'cajas' },
  ];

  private fmt = new Intl.NumberFormat('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  constructor(
    private tesoreriaReporteService: TesoreriaReporteService,
    private cajaVirtualService: CajaVirtualService,
    private tabService: TabService,
    public mainService: MainService,
    private notificacion: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    // Cada fuente falla por su cuenta (error de red o null): las demás se muestran, y lo que no cargó dice
    // «No disponible» en vez de un 0 que parece real. Sin esto una sola fuente colgaba las cuatro (#390).
    const fuente = <T>(o: Observable<T>) => o.pipe(catchError(() => of(null as T)));
    forkJoin({
      saldo: fuente(this.tesoreriaReporteService.onGetSaldoConsolidado()),
      vencimientos: fuente(this.tesoreriaReporteService.onGetProximosVencimientos(30)),
      aging: fuente(this.tesoreriaReporteService.onGetAgingCpp()),
      cajas: fuente(this.cajaVirtualService.onGetActivas(PROPAGAR_ERROR_DE_RED,
        { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true })),
    }).pipe(untilDestroyed(this)).subscribe(res => {
      this.cargando = false;
      const saldos = res.saldo || [];
      this.armarKpis(res.saldo, res.aging, res.cajas);
      this.vencimientoItems = (res.vencimientos || []).map(v => this.toRankingItem(v));
      this.vencimientosNoCargados = res.vencimientos == null;
      this.cajasNoCargadas = res.cajas == null;
      this.cajaCards = (res.cajas || []).map(c => ({ caja: c, saldoLabel: 'Gs. ' + this.fmt.format(c.saldoGs || 0) }));
      this.armarGrafico(saldos);
      const faltan = [res.saldo == null ? 'saldos' : null, res.aging == null ? 'cuentas por pagar' : null,
        res.vencimientos == null ? 'vencimientos' : null, res.cajas == null ? 'cajas' : null].filter(f => f != null);
      if (faltan.length > 0) {
        this.notificacion.openWarn('No se pudieron cargar: ' + faltan.join(', ') + '. Usá «Actualizar».', 5);
      }
    });
  }

  /** Gráfico de barras: efectivo vs banco por moneda (usa saldoConsolidado). */
  private armarGrafico(saldos: SaldoTesoreria[]) {
    this.serieHayDatos = saldos.some(s => (s.efectivo || 0) !== 0 || (s.banco || 0) !== 0);
    if (!this.serieHayDatos) { this.serieOpciones = null; return; }
    const monedas = saldos.map(s => s.moneda);
    this.serieOpciones = {
      backgroundColor: 'transparent',
      grid: { top: 30, right: 20, bottom: 30, left: 55 },
      tooltip: { trigger: 'axis' },
      legend: { data: ['Efectivo', 'Banco'], textStyle: { color: GRAFICO_COLORES.textSecondary, fontSize: 13 }, top: 0 },
      xAxis: {
        type: 'category',
        data: monedas,
        axisLabel: { color: GRAFICO_COLORES.textSecondary, fontSize: 13 },
        axisLine: { lineStyle: { color: GRAFICO_COLORES.axisLine } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: GRAFICO_COLORES.textSecondary, fontSize: 13, formatter: (v: number) => formatoEjeCompacto(v) },
        splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
      },
      series: [
        { name: 'Efectivo', type: 'bar', data: saldos.map(s => s.efectivo || 0),
          itemStyle: { color: GRAFICO_COLORES.primary, borderRadius: [3, 3, 0, 0] }, barMaxWidth: 32 },
        { name: 'Banco', type: 'bar', data: saldos.map(s => s.banco || 0),
          itemStyle: { color: GRAFICO_COLORES.accent, borderRadius: [3, 3, 0, 0] }, barMaxWidth: 32 },
      ],
    };
  }

  /** null = esa fuente no cargó: se muestra «No disponible», no un 0. */
  private armarKpis(saldos: SaldoTesoreria[] | null, aging: AgingTesoreria | null, cajas: CajaVirtual[] | null) {
    const kpis: KpiItem[] = saldos == null
      ? [{ icon: 'account_balance_wallet', color: 'warning', label: 'Saldos', value: NO_DISPONIBLE }]
      : saldos.map(s => ({
      icon: 'account_balance_wallet',
      color: (s.total || 0) < 0 ? 'error' : 'primary',
      label: s.moneda,
      value: this.fmt.format(s.total || 0),
    }));
    kpis.push({
      icon: 'warning',
      color: aging == null ? 'warning' : ((aging.vencido || 0) > 0 ? 'error' : 'success'),
      label: 'CPP Vencido',
      value: aging == null ? NO_DISPONIBLE : this.fmt.format(aging.vencido || 0),
    });
    kpis.push({
      icon: 'savings',
      color: cajas == null ? 'warning' : 'info',
      label: 'Cajas Activas',
      value: cajas == null ? NO_DISPONIBLE : String(cajas.length),
    });
    this.kpis = kpis;
  }

  private toRankingItem(v: VencimientoTesoreria): DashRankingItem {
    return {
      nombre: `${v.tipo} · ${v.descripcion}`,
      valorPrincipal: this.fmt.format(v.monto || 0),
      valorSecundario: v.diasRestantes < 0 ? 'Vencido' : `${v.diasRestantes} días`,
    };
  }

  onAcceso(accion: string) {
    switch (accion) {
      case 'operaciones': this.abrir(ListOperacionFinancieraComponent, 'Operaciones Financieras'); break;
      case 'cheques': this.abrir(ChequesDashboardComponent, 'Cheques'); break;
      case 'cuentas': this.abrir(CuentaBancariaComponent, 'Cuentas Bancarias'); break;
      case 'bancos': this.abrir(BancoComponent, 'Bancos'); break;
      case 'monedas': this.abrir(MonedaComponent, 'Monedas'); break;
      case 'cajas': this.abrir(ListCajaVirtualComponent, 'Cajas'); break;
    }
  }

  abrirCaja(caja: CajaVirtual) {
    this.tabService.addTab(new Tab(CajaVirtualDashboardComponent, `Caja: ${caja.nombre}`, new TabData(caja.id, caja), FinancieroDashboardComponent));
  }

  private abrir(comp: any, titulo: string) {
    this.tabService.addTab(new Tab(comp, titulo, null, FinancieroDashboardComponent));
  }
}
