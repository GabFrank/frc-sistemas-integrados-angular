import { Component, OnInit } from "@angular/core";
import { TabService } from "../../../../layouts/tab/tab.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { ListTerminalPosComponent } from "../list-terminal-pos/list-terminal-pos.component";
import { MainService } from "../../../../main.service";
import { ListVentaTarjetaComponent } from "../../venta-tarjeta/list-venta-tarjeta/list-venta-tarjeta.component";

@Component({
  selector: 'app-terminal-pos-dashboard',
  templateUrl: './terminal-pos-dashboard.component.html',
  styleUrls: ['./terminal-pos-dashboard.component.scss']
})
export class TerminalPosDashboard  implements OnInit{
  ngOnInit(): void {
    
  }

  constructor(
    private tabService: TabService,
    private mainService: MainService
  ) {}

  onNuevaTerminalPos() {
    this.tabService.addTab(new Tab(ListTerminalPosComponent, 'Lista de terminales', null, TerminalPosDashboard));
  }

  onListVentaTarjeta() {
    this.tabService.addTab(new Tab(ListVentaTarjetaComponent, 'Lista de ventas con tarjeta', null, TerminalPosDashboard));
  }
}