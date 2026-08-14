import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin } from 'rxjs';
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
import { DashRankingItem } from '../../../shared/components/dashboard/dash-ranking-list/dash-ranking-list.component';
import { EChartsOption } from 'echarts';
import { GRAFICO_COLORES, formatoEjeCompacto } from '../../../shared/utils/grafico-echarts.theme';

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
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    forkJoin({
      saldo: this.tesoreriaReporteService.onGetSaldoConsolidado(),
      vencimientos: this.tesoreriaReporteService.onGetProximosVencimientos(30),
      aging: this.tesoreriaReporteService.onGetAgingCpp(),
      cajas: this.cajaVirtualService.onGetActivas(),
    }).pipe(untilDestroyed(this)).subscribe(res => {
      this.cargando = false;
      const saldos = res.saldo || [];
      this.armarKpis(saldos, res.aging || new AgingTesoreria(), (res.cajas || []).length);
      this.vencimientoItems = (res.vencimientos || []).map(v => this.toRankingItem(v));
      this.cajaCards = (res.cajas || []).map(c => ({ caja: c, saldoLabel: 'Gs. ' + this.fmt.format(c.saldoGs || 0) }));
      this.armarGrafico(saldos);
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

  private armarKpis(saldos: SaldoTesoreria[], aging: AgingTesoreria, cajasActivas: number) {
    const kpis: KpiItem[] = saldos.map(s => ({
      icon: 'account_balance_wallet',
      color: (s.total || 0) < 0 ? 'error' : 'primary',
      label: s.moneda,
      value: this.fmt.format(s.total || 0),
    }));
    kpis.push({
      icon: 'warning',
      color: (aging.vencido || 0) > 0 ? 'error' : 'success',
      label: 'CPP Vencido',
      value: this.fmt.format(aging.vencido || 0),
    });
    kpis.push({
      icon: 'savings',
      color: 'info',
      label: 'Cajas Activas',
      value: String(cajasActivas),
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
