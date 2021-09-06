import { Component, OnInit } from '@angular/core';
import { Tab } from '../../../layouts/tab/tab.model';
import { TabService } from '../../../layouts/tab/tab.service';
import { MainService } from '../../../main.service';
import { ListCiudadComponent } from '../../../modules/general/ciudad/list-ciudad/list-ciudad.component';
import { ListPaisComponent } from '../../../modules/general/pais/list-pais/list-pais.component';
import { ListCompraComponent } from '../../../modules/operaciones/compra/list-compra/list-compra.component';
import { ListNecesidadComponent } from '../../../modules/operaciones/necesidad/list-necesidad/list-necesidad.component';
import { ListPedidoComponent } from '../../../modules/operaciones/pedido/list-pedido/list-pedido.component';
import { VentaTouchComponent } from '../../../modules/pdv/comercial/venta-touch/venta-touch.component';
import { RestaurantComponent } from '../../../modules/pdv/restaurant/restaurant.component';
import { ListFuncioarioComponent } from '../../../modules/personas/funcionarios/list-funcioario/list-funcioario.component';
import { ListPersonaComponent } from '../../../modules/personas/persona/list-persona/list-persona.component';
import { ListUsuarioComponent } from '../../../modules/personas/usuarios/list-usuario/list-usuario.component';
import { ListProductoComponent } from '../../../modules/productos/producto/list-producto/list-producto.component';

@Component({
  selector: 'app-side',
  templateUrl: './side.component.html',
  styleUrls: ['./side.component.scss']
})
export class SideComponent implements OnInit {

  constructor(public tabService: TabService, public mainService: MainService) { }

  ngOnInit(): void {
  }

  onItemClick(tab: string): void {
    switch (tab) {
      case 'list-persona':
        this.tabService.addTab(new Tab(ListPersonaComponent, 'Personas', null, null));
        break;
      case 'list-usuario':
        this.tabService.addTab(new Tab(ListUsuarioComponent, 'Usuarios', null, null));
        break;
      case 'list-producto':
        this.tabService.addTab(new Tab(ListProductoComponent, 'Productos', null, null));
        break;
      case 'list-compra':
        this.tabService.addTab(new Tab(ListCompraComponent, 'Compras', null, null));
        break;
      case 'list-pedido':
        this.tabService.addTab(new Tab(ListPedidoComponent, 'Pedidos', null, null));
        break;
      case 'pdv-restaurant':
        this.tabService.addTab(new Tab(RestaurantComponent, 'Venta Restaurant', null, null));
        break;
      case 'list-funcionario':
        this.tabService.addTab(new Tab(ListFuncioarioComponent, 'Funcionarios', null, null));
        break;
      case 'list-paises':
        this.tabService.addTab(new Tab(ListPaisComponent, 'Países', null, null));
        break;
      case 'list-ciudades':
        this.tabService.addTab(new Tab(ListCiudadComponent, 'Ciudades', null, null));
        break;
      case 'list-necesidad':
        this.tabService.addTab(new Tab(ListNecesidadComponent, 'Necesidades', null, null));
        break;
      case 'pdv-venta-touch':
          this.tabService.addTab(new Tab(VentaTouchComponent, 'Venta Touch', null, null));
          break;
      default:
        break;
    }
  }

}
