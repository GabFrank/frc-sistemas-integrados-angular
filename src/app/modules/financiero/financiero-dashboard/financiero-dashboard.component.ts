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
import { MainService } from '../../../main.service';

interface AccesoRapido {
  titulo: string;
  icono: string;
  color: string;
  accion: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-financiero-dashboard',
  templateUrl: './financiero-dashboard.component.html',
  styleUrls: ['./financiero-dashboard.component.scss']
})
export class FinancieroDashboardComponent implements OnInit {

  saldoList: SaldoTesoreria[] = [];
  vencimientoList: VencimientoTesoreria[] = [];
  aging: AgingTesoreria = new AgingTesoreria();
  cajasActivas: CajaVirtual[] = [];

  isLoading = false;

  accesos: AccesoRapido[] = [
    { titulo: 'Operaciones Financieras', icono: 'sync_alt', color: '#6a1b9a', accion: 'operaciones' },
    { titulo: 'Cuentas Bancarias', icono: 'account_balance', color: '#1565c0', accion: 'cuentas' },
    { titulo: 'Bancos', icono: 'business', color: '#00838f', accion: 'bancos' },
    { titulo: 'Monedas', icono: 'paid', color: '#2e7d32', accion: 'monedas' },
    { titulo: 'Todas las Cajas', icono: 'account_balance_wallet', color: '#e65100', accion: 'cajas' },
  ];

  constructor(
    private tesoreriaReporteService: TesoreriaReporteService,
    private cajaVirtualService: CajaVirtualService,
    private tabService: TabService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.recargar();
  }

  recargar() {
    this.isLoading = true;
    forkJoin({
      saldo: this.tesoreriaReporteService.onGetSaldoConsolidado(),
      vencimientos: this.tesoreriaReporteService.onGetProximosVencimientos(30),
      aging: this.tesoreriaReporteService.onGetAgingCpp(),
      cajas: this.cajaVirtualService.onGetActivas(),
    }).pipe(untilDestroyed(this)).subscribe(res => {
      this.isLoading = false;
      this.saldoList = res.saldo || [];
      this.vencimientoList = (res.vencimientos || []).map(v => ({ ...v, vencido: v.diasRestantes < 0 }));
      this.aging = res.aging || new AgingTesoreria();
      this.cajasActivas = res.cajas || [];
    });
  }

  onAcceso(accion: string) {
    switch (accion) {
      case 'operaciones': this.abrir(ListOperacionFinancieraComponent, 'Operaciones Financieras'); break;
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
