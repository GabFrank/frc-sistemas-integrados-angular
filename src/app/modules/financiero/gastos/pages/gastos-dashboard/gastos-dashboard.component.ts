import { Component, OnInit } from '@angular/core';
import { BotonData } from '../../../../../shared/components/boton/boton.component';
import { MainService } from '../../../../../main.service';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { ListGastosComponent } from '../list-gastos/list-gastos.component';
import { ListTipoGastosComponent } from '../list-tipo-gastos/list-tipo-gastos.component';
import { ListPreGastosComponent } from '../list-pre-gastos/list-pre-gastos.component';
import { AdicionarPreGastoComponent } from '../adicionar-pre-gasto/adicionar-pre-gasto.component';

@Component({
  selector: 'app-gastos-dashboard',
  templateUrl: './gastos-dashboard.component.html',
  styleUrls: ['./gastos-dashboard.component.scss']
})
export class GastosDashboardComponent implements OnInit {

  botonesList: BotonData[];

  constructor(
    public mainService: MainService,
    private tabService: TabService,
  ) { }

  ngOnInit(): void {
    this.crearBotones()
  }

  crearBotones() {
    this.botonesList = []
    this.botonesList.push(
      {
        nombre: 'Gastos',
        clickEvent: 'list-gastos',
        icon: 'money_off',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Tipos de Gastos',
        clickEvent: 'list-tipo-gastos',
        icon: 'settings',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Solicitudes de Gasto',
        clickEvent: 'list-pre-gastos',
        icon: 'request_quote',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Nuevo Pre-Gasto',
        clickEvent: 'adicionar-pre-gasto',
        icon: 'add_shopping_cart',
        iconSize: 4,
        expression: false
      }
    )
  }

  goTo(func) {
    switch (func) {
      case 'list-gastos':
        this.onListGastos()
        break;
      case 'list-tipo-gastos':
        this.onListTipoGastos()
        break;
      case 'list-pre-gastos':
        this.onListPreGastos()
        break;
      case 'adicionar-pre-gasto':
        this.onAdicionarPreGasto()
        break;
    }
  }

  onListGastos() {
    this.tabService.addTab(new Tab(ListGastosComponent, "Gastos", null, GastosDashboardComponent))
  }

  onListTipoGastos() {
    this.tabService.addTab(new Tab(ListTipoGastosComponent, "Tipos de Gastos", null, GastosDashboardComponent))
  }

  onListPreGastos() {
    this.tabService.addTab(new Tab(ListPreGastosComponent, "Solicitudes de Gasto", null, GastosDashboardComponent))
  }

  onAdicionarPreGasto() {
    this.tabService.addTab(new Tab(AdicionarPreGastoComponent, "Nuevo Pre-Gasto", null, GastosDashboardComponent))
  }
}
