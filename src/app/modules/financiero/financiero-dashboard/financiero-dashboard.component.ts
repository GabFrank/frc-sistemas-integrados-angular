import { Component, OnInit, Type } from "@angular/core";
import { WindowInfoService } from "../../../shared/services/window-info.service";
import { MaletinComponent } from "../maletin/maletin.component";

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

  constructor(public windowInfoService: WindowInfoService) {}

  ngOnInit(): void {
    this.itemList = [];

    this.cargarList();

    this.cardWidth = Math.floor(this.windowInfoService.innerWidth / 5);
  }

  cargarList() {
    this.itemList = [
      {
        titulo: "Maletin",
        component: MaletinComponent,
        descripcion:
          "El maletin representa el objeto físico en donde se transporta efectivo para apertura y cierre de caja",
        icon: "card_travel",
      },
      {
        titulo: "Maletin",
        component: MaletinComponent,
        descripcion:
          "El maletin representa el objeto físico en donde se transporta efectivo para apertura y cierre de caja",
        icon: "card_travel",
      },
      {
        titulo: "Maletin",
        component: MaletinComponent,
        descripcion:
          "El maletin representa el objeto físico en donde se transporta efectivo para apertura y cierre de caja",
        icon: "card_travel",
      },
      {
        titulo: "Maletin",
        component: MaletinComponent,
        descripcion:
          "El maletin representa el objeto físico en donde se transporta efectivo para apertura y cierre de caja",
        icon: "card_travel",
      },
      {
        titulo: "Maletin",
        component: MaletinComponent,
        descripcion:
          "El maletin representa el objeto físico en donde se transporta efectivo para apertura y cierre de caja",
        icon: "card_travel",
      },
      {
        titulo: "Maletin",
        component: MaletinComponent,
        descripcion:
          "El maletin representa el objeto físico en donde se transporta efectivo para apertura y cierre de caja",
        icon: "card_travel",
      },
      {
        titulo: "Maletin",
        component: MaletinComponent,
        descripcion:
          "El maletin representa el objeto físico en donde se transporta efectivo para apertura y cierre de caja",
        icon: "card_travel",
      },
      {
        titulo: "Maletin",
        component: MaletinComponent,
        descripcion:
          "El maletin representa el objeto físico en donde se transporta efectivo para apertura y cierre de caja",
        icon: "card_travel",
      },
      {
        titulo: "Maletin",
        component: MaletinComponent,
        descripcion:
          "El maletin representa el objeto físico en donde se transporta efectivo para apertura y cierre de caja",
        icon: "card_travel",
      },
      {
        titulo: "Maletin",
        component: MaletinComponent,
        descripcion:
          "El maletin representa el objeto físico en donde se transporta efectivo para apertura y cierre de caja",
        icon: "card_travel",
      },
      {
        titulo: "Maletin",
        component: MaletinComponent,
        descripcion:
          "El maletin representa el objeto físico en donde se transporta efectivo para apertura y cierre de caja",
        icon: "card_travel",
      },
      {
        titulo: "Maletin",
        component: MaletinComponent,
        descripcion:
          "El maletin representa el objeto físico en donde se transporta efectivo para apertura y cierre de caja",
        icon: "card_travel",
      },
    ];
  }
}
