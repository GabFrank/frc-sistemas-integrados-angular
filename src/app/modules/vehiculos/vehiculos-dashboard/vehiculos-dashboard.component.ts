import { Component, OnInit } from '@angular/core';
import { TabService } from '../../../layouts/tab/tab.service';
import { MainService } from '../../../main.service';
import { BotonData } from '../../../shared/components/boton/boton.component';
import { ListVehiculosComponent } from '../vehiculo/list-vehiculos/list-vehiculos.component';
import { ListVehiculoSucursalComponent } from '../vehiculo-sucursal/list-vehiculo-sucursal/list-vehiculo-sucursal.component';
import { Tab } from '../../../layouts/tab/tab.model';
import { ListGpsComponent } from '../list-gps/list-gps.component';

@Component({
  selector: 'app-vehiculos-dashboard',
  templateUrl: './vehiculos-dashboard.component.html',
  styleUrls: ['./vehiculos-dashboard.component.scss']
})
export class VehiculosDashboardComponent implements OnInit {

  botonesList: BotonData[];

  constructor(
    public mainService: MainService,
    private tabService: TabService,
  ) {
  }

  ngOnInit(): void {
    this.crearBotones()
  }

  crearBotones() {
    this.botonesList = []
    this.botonesList.push(
      {
        nombre: 'Lista de vehículos',
        clickEvent: 'list-vehiculos',
        icon: 'directions_car',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Lista de vehiculos por sucursal',
        clickEvent: 'list-vehiculo-sucursal',
        icon: 'location_on',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Gps',
        clickEvent: 'gps',
        icon: 'location_on',
        iconSize: 4,
        expression: false
      }
    )
  }

  goTo(func) {
    switch (func) {
      case 'list-vehiculos':
        this.onListVehiculos()
        break;
      case 'list-vehiculo-sucursal':
        this.onListVehiculoSucursal()
        break;
      case 'gps':
        this.onGps()
        break;
    }
  }

  onListVehiculos() {
    this.tabService.addTab(new Tab(ListVehiculosComponent, "Lista de vehículos", null, VehiculosDashboardComponent))
  }

  onListVehiculoSucursal() {
    this.tabService.addTab(new Tab(ListVehiculoSucursalComponent, "Vehículo por Sucursal", null, VehiculosDashboardComponent))
  }

  onGps() {
    this.tabService.addTab(new Tab(ListGpsComponent, "Gps", null, VehiculosDashboardComponent))
  }
}

