import { Component, OnInit } from "@angular/core";
import { TabService } from "../../../../layouts/tab/tab.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { MainService } from "../../../../main.service";
import { ROLES } from "../../../personas/roles/roles.enum";
import { MatDialog } from "@angular/material/dialog";
import { ListFacturaLegalComponent } from "../list-factura-legal/list-factura-legal.component";
import { ConfiguracionFacturaConVentaDialogComponent } from "../configuracion-factura-con-venta-dialog/configuracion-factura-con-venta-dialog.component";

@Component({
  selector: 'app-factura-legal-dashboard',
  templateUrl: './factura-legal-dashboard.component.html',
  styleUrls: ['./factura-legal-dashboard.component.scss']
})
export class FacturaLegalDashboard  implements OnInit{

  readonly ROLES = ROLES;
  ngOnInit(): void {
    
  }

  constructor(
    private tabService: TabService,
    public mainService: MainService,
    private matDialog: MatDialog
  ) {}

  onListaFacturas() {
    this.tabService.addTab(new Tab(ListFacturaLegalComponent, 'Lista de facturas', null, FacturaLegalDashboard));
  }

  onAbrirConfiguracion() {
    this.matDialog.open(ConfiguracionFacturaConVentaDialogComponent, {
      width: '560px',
      disableClose: false,
      panelClass: 'custom-dialog-container'
    });
  }
}