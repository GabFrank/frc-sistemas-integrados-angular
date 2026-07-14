import { Component, OnInit } from "@angular/core";
import { TabService } from "../../../../layouts/tab/tab.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { ListTerminalPosComponent } from "../list-terminal-pos/list-terminal-pos.component";
import { MainService } from "../../../../main.service";
import { ListVentaTarjetaComponent } from "../../venta-tarjeta/list-venta-tarjeta/list-venta-tarjeta.component";
import { ROLES } from "../../../personas/roles/roles.enum";
import { ConfiguracionVentaTarjetaDialogComponent } from "../../venta-tarjeta/configuracion-venta-tarjeta-dialog/configuracion-venta-tarjeta-dialog.component";
import { MatDialog } from "@angular/material/dialog";

@Component({
  selector: 'app-terminal-pos-dashboard',
  templateUrl: './terminal-pos-dashboard.component.html',
  styleUrls: ['./terminal-pos-dashboard.component.scss']
})
export class TerminalPosDashboard  implements OnInit{

  readonly ROLES = ROLES;
  ngOnInit(): void {
    
  }

  constructor(
    private tabService: TabService,
    public mainService: MainService,
    private matDialog: MatDialog
  ) {}

  onNuevaTerminalPos() {
    this.tabService.addTab(new Tab(ListTerminalPosComponent, 'Lista de terminales', null, TerminalPosDashboard));
  }

  onListVentaTarjeta() {
    this.tabService.addTab(new Tab(ListVentaTarjetaComponent, 'Lista de ventas con tarjeta', null, TerminalPosDashboard));
  }

  onAbrirConfiguracion() {
    this.matDialog.open(ConfiguracionVentaTarjetaDialogComponent, {
      width: '560px',
      disableClose: false,
      panelClass: 'custom-dialog-container'
    });
  }
}