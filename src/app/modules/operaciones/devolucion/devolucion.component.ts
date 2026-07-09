import { Component, OnInit } from "@angular/core";
import { Tab } from "../../../layouts/tab/tab.model";
import { TabService } from "../../../layouts/tab/tab.service";
import { MainService } from "../../../main.service";
import { ROLES } from "../../personas/roles/roles.enum";
import { EditDevolucionComponent } from "./edit-devolucion/edit-devolucion.component";
import { ListDevolucionComponent } from "./list-devolucion/list-devolucion.component";

@Component({
  selector: "app-devolucion",
  templateUrl: "./devolucion.component.html",
  styleUrls: ["./devolucion.component.scss"],
})
export class DevolucionComponent implements OnInit {
  readonly ROLES = ROLES;

  constructor(
    private tabService: TabService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {}

  onListDevoluciones() {
    this.tabService.addTab(
      new Tab(
        ListDevolucionComponent,
        "Lista de devoluciones",
        null,
        DevolucionComponent
      )
    );
  }

  onNuevaDevolucion() {
    this.tabService.addTab(
      new Tab(
        EditDevolucionComponent,
        "Nueva devolución",
        null,
        DevolucionComponent
      )
    );
  }
}
