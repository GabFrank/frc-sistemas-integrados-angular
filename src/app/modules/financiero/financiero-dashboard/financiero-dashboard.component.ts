import { Component, OnInit, Type } from "@angular/core";
import { Tab } from "../../../layouts/tab/tab.model";
import { TabService } from "../../../layouts/tab/tab.service";
import { WindowInfoService } from "../../../shared/services/window-info.service";
import { ListMaletinComponent } from "../maletin/list-maletin/list-maletin.component";
import { MaletinComponent } from "../maletin/maletin.component";
import { ListFacturaLegalComponent } from "../factura-legal/list-factura-legal/list-factura-legal.component";
import { MatDialog } from "@angular/material/dialog";

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
    public tabService: TabService
  ) {}

  ngOnInit(): void {
  }

  onListFacturas(){
    this.tabService.addTab(new Tab(ListFacturaLegalComponent, 'Lista de facturas', null, FinancieroDashboardComponent))
  }
}
