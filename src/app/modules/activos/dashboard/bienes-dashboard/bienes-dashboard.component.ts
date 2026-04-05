import { Component, OnInit } from '@angular/core';
import { BotonData } from '../../../../shared/components/boton/boton.component';
import { MainService } from '../../../../main.service';
import { TabService } from '../../../../layouts/tab/tab.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { ListMueblesComponent } from '../../muebles/pages/list-muebles/list-muebles.component';
import { ListInmueblesComponent } from '../../inmueble/pages/list-inmuebles/list-inmuebles.component';
import { ListBienesSucursalComponent } from '../../ente/pages/list-bienes-sucursal/list-bienes-sucursal.component';
import { ListTipoGastosComponent } from '../../../financiero/gastos/pages/list-tipo-gastos/list-tipo-gastos.component';
import { ListPreGastosComponent } from '../../../financiero/gastos/pages/list-pre-gastos/list-pre-gastos.component';

@Component({
  selector: 'bienes-dashboard',
  templateUrl: './bienes-dashboard.component.html',
  styleUrls: ['./bienes-dashboard.component.scss']
})
export class BienesDashboardComponent implements OnInit {

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
        nombre: 'Lista de muebles',
        clickEvent: 'list-muebles',
        icon: 'chair',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Lista de inmuebles',
        clickEvent: 'list-inmuebles',
        icon: 'domain',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Bienes por sucursal',
        clickEvent: 'list-bienes-sucursal',
        icon: 'location_on',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Tipos de Gastos',
        clickEvent: 'list-tipo-gastos',
        icon: 'payments',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Solicitudes de Gasto',
        clickEvent: 'list-pre-gastos',
        icon: 'request_quote',
        iconSize: 4,
        expression: false
      }
    )
  }

  goTo(func) {
    switch (func) {
      case 'list-muebles':
        this.onListMuebles()
        break;
      case 'list-inmuebles':
        this.onListInmuebles()
        break;
      case 'list-bienes-sucursal':
        this.onListBienesSucursal()
        break;
      case 'list-tipo-gastos':
        this.onListTipoGastos()
        break;
      case 'list-pre-gastos':
        this.onListPreGastos()
        break;
    }
  }

  onListMuebles() {
    this.tabService.addTab(new Tab(ListMueblesComponent, "Muebles", null, BienesDashboardComponent))
  }

  onListInmuebles() {
    this.tabService.addTab(new Tab(ListInmueblesComponent, "Inmuebles", null, BienesDashboardComponent))
  }

  onListBienesSucursal() {
    this.tabService.addTab(new Tab(ListBienesSucursalComponent, "Bienes por sucursal", null, BienesDashboardComponent))
  }

  onListTipoGastos() {
    this.tabService.addTab(new Tab(ListTipoGastosComponent, "Tipos de Gastos", null, BienesDashboardComponent))
  }

  onListPreGastos() {
    this.tabService.addTab(new Tab(ListPreGastosComponent, "Solicitudes de Gasto", null, BienesDashboardComponent))
  }
}