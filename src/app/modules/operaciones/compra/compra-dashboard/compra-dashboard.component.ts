import { Component } from '@angular/core';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ListCompraComponent } from '../list-compra/list-compra.component';
import { ListSolicitudPagoComponent } from '../../solicitud-pago/list-solicitud-pago/list-solicitud-pago.component';
import { ROLES } from '../../../personas/roles/roles.enum';

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
    if (
      this.mainService.usuarioActual?.roles.includes(
        ROLES.ADMIN
      ) || true
    ) {
      this.tabService.addTab(new Tab(ListCompraComponent, 'Lista de compras', null, CompraDashboardComponent))
    } else {
      this.notificacionService.openWarn('No tenés acceso a esta opción. ')
    }
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
    if (
      this.mainService.usuarioActual?.roles.includes(ROLES.ADMIN) ||
      this.mainService.usuarioActual?.roles.includes(ROLES.SOPORTE) ||
      true
    ) {
      this.tabService.addTab(
        new Tab(ListSolicitudPagoComponent, 'Solicitudes de pago', null, CompraDashboardComponent)
      );
    } else {
      this.notificacionService.openWarn('No tenés acceso a esta opción.');
    }
  }
}
