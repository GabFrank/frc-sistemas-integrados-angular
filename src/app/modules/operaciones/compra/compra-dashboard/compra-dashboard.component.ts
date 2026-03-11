import { Component } from '@angular/core';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ListCompraComponent } from '../list-compra/list-compra.component';
import { ListSolicitudPagoComponent } from '../../solicitud-pago/list-solicitud-pago/list-solicitud-pago.component';

@Component({
  selector: 'compra-dashboard',
  templateUrl: './compra-dashboard.component.html',
  styleUrls: ['./compra-dashboard.component.scss']
})
export class CompraDashboardComponent {
  constructor(
    public tabService: TabService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
  }

  onListCompras() {
    this.tabService.addTab(new Tab(ListCompraComponent, 'Lista de compras', null, CompraDashboardComponent));
  }

  onListProveedores() {
    // TODO: Implementar cuando se cree el componente de lista de proveedores
    this.notificacionService.openWarn('Funcionalidad en desarrollo. ')
  }

  onListVendedores() {
    // TODO: Implementar cuando se cree el componente de lista de vendedores
    this.notificacionService.openWarn('Funcionalidad en desarrollo. ')
  }

  onListSolicitudesPago() {
    this.tabService.addTab(
      new Tab(ListSolicitudPagoComponent, 'Solicitudes de pago', null, CompraDashboardComponent)
    );
  }
}
