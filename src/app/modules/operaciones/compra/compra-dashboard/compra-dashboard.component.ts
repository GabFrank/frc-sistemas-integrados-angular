import { Component, Type } from '@angular/core';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ListFacturaLegalComponent } from '../../../financiero/factura-legal/list-factura-legal/list-factura-legal.component';
import { FinancieroDashboardComponent } from '../../../financiero/financiero-dashboard/financiero-dashboard.component';
import { ListGastosComponent } from '../../../financiero/gastos/list-gastos/list-gastos.component';
import { ListRetiroComponent } from '../../../financiero/retiro/list-retiro/list-retiro.component';
import { ROLES } from '../../../personas/roles/roles.enum';
import { ListPedidoComponent } from '../../pedido/list-pedido/list-pedido.component';

interface ItemDashboard {
  titulo: string;
  component: Type<any>;
  descripcion: string;
  icon: string;
}

@Component({
  selector: 'compra-dashboard',
  templateUrl: './compra-dashboard.component.html',
  styleUrls: ['./compra-dashboard.component.scss']
})
export class CompraDashboardComponent {
  itemList: ItemDashboard[];
  cardWidth;

  constructor(
    public tabService: TabService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
  }

  onListPedidos() {
    if (
      this.mainService.usuarioActual?.roles.includes(
        ROLES.ADMIN
      ) || true
    ) {
      this.tabService.addTab(new Tab(ListPedidoComponent, 'Lista de pedidos', null, CompraDashboardComponent))
    } else {
      this.notificacionService.openWarn('No tenés acceso a esta opción. ')
    }
  }
  onListCompras() {
    if (
      this.mainService.usuarioActual?.roles.includes(
        ROLES.ANALISIS_CONTABLE
      )
    ) {
      this.tabService.addTab(new Tab(ListRetiroComponent, 'Lista de retiros', null, FinancieroDashboardComponent))
    } else {
      this.notificacionService.openWarn('No tenés acceso a esta opción. ')
    }
  }
  onNewPedido() {
    if (
      this.mainService.usuarioActual?.roles.includes(
        ROLES.ANALISIS_CONTABLE
      )
    ) {
      this.tabService.addTab(new Tab(ListRetiroComponent, 'Lista de retiros', null, FinancieroDashboardComponent))
    } else {
      this.notificacionService.openWarn('No tenés acceso a esta opción. ')
    }
  }
  onListProveedores() {
    if (
      this.mainService.usuarioActual?.roles.includes(
        ROLES.ANALISIS_CONTABLE
      )
    ) {
      this.tabService.addTab(new Tab(ListRetiroComponent, 'Lista de retiros', null, FinancieroDashboardComponent))
    } else {
      this.notificacionService.openWarn('No tenés acceso a esta opción. ')
    }
  }
}
