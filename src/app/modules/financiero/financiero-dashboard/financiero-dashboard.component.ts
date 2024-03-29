import { Component, OnInit, Type } from "@angular/core";
import { Tab } from "../../../layouts/tab/tab.model";
import { TabService } from "../../../layouts/tab/tab.service";
import { WindowInfoService } from "../../../shared/services/window-info.service";
import { ListMaletinComponent } from "../maletin/list-maletin/list-maletin.component";
import { MaletinComponent } from "../maletin/maletin.component";
import { ListFacturaLegalComponent } from "../factura-legal/list-factura-legal/list-factura-legal.component";
import { MatDialog } from "@angular/material/dialog";
import { MainService } from "../../../main.service";
import { ROLES } from "../../personas/roles/roles.enum";
import { NotificacionSnackbarService } from "../../../notificacion-snackbar.service";
import { ListRetiroComponent } from "../retiro/list-retiro/list-retiro.component";
import { ListGastosComponent } from "../gastos/list-gastos/list-gastos.component";

interface FinancieroItemDashboard {
  titulo: string;
  component: Type<any>;
  descripcion: string;
  icon: string;
}

@Component({
  selector: "app-financiero-dashboard",
  templateUrl: "./financiero-dashboard.component.html",
  styleUrls: ["./financiero-dashboard.component.scss"],
})
export class FinancieroDashboardComponent implements OnInit {
  itemList: FinancieroItemDashboard[];
  cardWidth;

  constructor(
    public tabService: TabService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
  }

  onListFacturas() {
    if (
      this.mainService.usuarioActual?.roles.includes(
        ROLES.ANALISIS_CONTABLE
      )
    ) {
      this.tabService.addTab(new Tab(ListFacturaLegalComponent, 'Lista de facturas', null, FinancieroDashboardComponent))
    } else {
      this.notificacionService.openWarn('No tenés acceso a esta opción. ')
    }
  }

  onListRetiros() {
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

  onListGastos() {
    if (
      this.mainService.usuarioActual?.roles.includes(
        ROLES.ANALISIS_CONTABLE
      )
    ) {
      this.tabService.addTab(new Tab(ListGastosComponent, 'Lista de gastos', null, FinancieroDashboardComponent))
    } else {
      this.notificacionService.openWarn('No tenés acceso a esta opción. ')
    }
  }
}
