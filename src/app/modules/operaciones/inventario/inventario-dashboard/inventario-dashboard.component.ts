import { TabService } from './../../../../layouts/tab/tab.service';
import { Component, OnInit } from '@angular/core';
import { Tab } from '../../../../layouts/tab/tab.model';
import { ListInventarioComponent } from '../list-inventario/list-inventario.component';
import { EditInventarioComponent } from '../edit-inventario/edit-inventario.component';
import { ListSectorComponent } from '../../../empresarial/sector/list-sector/list-sector.component';
import { ListProductosVencidosComponent } from '../list-productos-vencidos/list-productos-vencidos.component';

@Component({
  selector: 'app-inventario-dashboard',
  templateUrl: './inventario-dashboard.component.html',
  styleUrls: ['./inventario-dashboard.component.scss'],
  
})
export class InventarioDashboardComponent implements OnInit {

  constructor(
    private tabService: TabService
  ) { }

  ngOnInit(): void {
  }

  onListInventarios(){
    this.tabService.addTab(new Tab(ListInventarioComponent, 'Lista de inventarios', null, InventarioDashboardComponent))
  }
  
  onNuevoInventario(){
    this.tabService.addTab(new Tab(EditInventarioComponent, 'Nuevo inventario', null, InventarioDashboardComponent))
  }

  onListSectores(){
    this.tabService.addTab(new Tab(ListSectorComponent, 'Lista de sectores', null, InventarioDashboardComponent))
  }

  onListProductosVencidos(){
    this.tabService.addTab(new Tab(ListProductosVencidosComponent, 'Lista de productos vencidos', null, InventarioDashboardComponent))
  }

}
