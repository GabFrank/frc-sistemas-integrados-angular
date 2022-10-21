import { Component, OnInit } from '@angular/core';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { BotonData } from '../../../../shared/components/boton/boton.component';
import { ListFuncioarioComponent } from '../../../personas/funcionarios/list-funcioario/list-funcioario.component';
import { EditPedidoComponent } from '../edit-pedido/edit-pedido.component';
import { ListPedidoComponent } from '../list-pedido/list-pedido.component';

@Component({
  selector: 'app-pedido-dashboard',
  templateUrl: './pedido-dashboard.component.html',
  styleUrls: ['./pedido-dashboard.component.scss']
})
export class PedidoDashboardComponent implements OnInit {

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
        nombre: 'Lista de pedidos',
        clickEvent: 'list',
        icon: 'receipt_long',
        iconSize: 2,
        expression: false
      },
      {
        nombre: 'Nuevo pedido',
        clickEvent: 'new',
        icon: 'receipt',
        iconSize: 2,
        expression: false
      }
    )
  }

  goTo(func) {
    switch (func) {
      case 'list':
        this.onListPedidos()
        break;
      case 'new':
        this.onNuevoPedido()
        break;
      case 'solicitudes':
        // this.onListPreRegistros()
        break;
    }
  }

  onListPedidos() {
    this.tabService.addTab(new Tab(ListPedidoComponent, 'Lista de pedidos'))
  }

  onNuevoPedido() {
    this.tabService.addTab(new Tab(EditPedidoComponent, 'Nuevo pedido'))
  }

  // onListPreRegistros() {
  //   this.tabService.addTab(new Tab(ListPreRegistroPedidoComponent, 'Lista de solicitudes'))
  // }

}
