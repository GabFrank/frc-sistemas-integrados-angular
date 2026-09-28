import { Component, OnInit } from "@angular/core";
import { TabService } from "../../../../layouts/tab/tab.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { MainService } from "../../../../main.service";
import { ROLES } from "../../../personas/roles/roles.enum";
import { MatDialog } from "@angular/material/dialog";
import { ListFacturaLegalComponent } from "../list-factura-legal/list-factura-legal.component";
import { ConfiguracionFacturaConVentaDialogComponent } from "../configuracion-factura-con-venta-dialog/configuracion-factura-con-venta-dialog.component";
import { ConfiguracionFacturacionDialogComponent } from "../configuracion-facturacion-dialog/configuracion-facturacion-dialog.component";

@Component({
  selector: 'app-factura-legal-dashboard',
  templateUrl: './factura-legal-dashboard.component.html',
  styleUrls: ['./factura-legal-dashboard.component.scss']
})
export class FacturaLegalDashboard  implements OnInit{

  readonly ROLES = ROLES;
  /** Calculado una vez: el template no llama funciones. */
  esAdmin = false;

  ngOnInit(): void {
    this.esAdmin = this.mainService.usuarioActual?.roles?.includes(ROLES.ADMIN) === true;
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

  /** Política de facturación automática del filial (issue filial #127). */
  onAbrirPoliticaFacturacion() {
    this.matDialog.open(ConfiguracionFacturacionDialogComponent, {
      width: '960px',
      maxWidth: '95vw',
      disableClose: false,
      panelClass: 'custom-dialog-container'
    });
  }
}