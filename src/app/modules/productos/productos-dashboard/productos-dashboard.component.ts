import { Component, OnInit } from '@angular/core';
import { Tab } from '../../../layouts/tab/tab.model';
import { TabService } from '../../../layouts/tab/tab.service';
import { ListGrupoComponent } from '../list-grupo/list-grupo.component';
import { ProductoComponent } from '../producto/edit-producto/producto.component';
import { ListProductoComponent } from '../producto/list-producto/list-producto.component';

@Component({
  selector: 'app-productos-dashboard',
  templateUrl: './productos-dashboard.component.html',
  styleUrls: ['./productos-dashboard.component.scss']
})
export class ProductosDashboardComponent implements OnInit {

  constructor(
    private tabService: TabService
  ) { }

  ngOnInit(): void {
  }

  onList(){
    this.tabService.addTab(new Tab(ListProductoComponent, 'Lista de productos', null, ProductosDashboardComponent))
  }

  onNew(){
    this.tabService.addTab(new Tab(ProductoComponent, 'Nuevo producto', null, ProductosDashboardComponent))
  }

  listFavoritos(){
    this.tabService.addTab(new Tab(ListGrupoComponent, 'Lista de favoritos', null, ProductosDashboardComponent))
  }


}
