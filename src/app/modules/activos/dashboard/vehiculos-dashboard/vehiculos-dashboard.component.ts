import { Component, OnInit } from '@angular/core';
import { BotonData } from '../../../../shared/components/boton/boton.component';
import { MainService } from '../../../../main.service';
import { TabService } from '../../../../layouts/tab/tab.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { ListVehiculosComponent } from '../../vehiculos/vehiculo/pages/list-vehiculos/list-vehiculos.component';
import { ListVehiculoSucursalComponent } from '../../vehiculos/vehiculo/pages/list-vehiculo-sucursal/list-vehiculo-sucursal.component';
import { ListGpsComponent } from '../../vehiculos/gps/pages/list-gps/list-gps.component';
import { ListMapasComponent } from '../../vehiculos/gps/pages/list-mapas/list-mapas.component';
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
        nombre: 'Dispositivos Gps',
        clickEvent: 'gps',
        icon: 'location_on',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Mapas',
        clickEvent: 'mapas',
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
      case 'mapas':
        this.onMapas()
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

  onMapas() {
    this.tabService.addTab(new Tab(ListMapasComponent, "Mapas", null, VehiculosDashboardComponent))
  }
}

