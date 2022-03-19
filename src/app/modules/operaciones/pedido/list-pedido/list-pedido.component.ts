import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { Subscription } from "rxjs";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { EditPedidoComponent } from "../edit-pedido/edit-pedido.component";
import { Pedido } from "../edit-pedido/pedido.model";
import { PedidoService } from "../pedido.service";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-pedido",
  templateUrl: "./list-pedido.component.html",
  styleUrls: ["./list-pedido.component.css"],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ListPedidoComponent implements OnInit, OnDestroy {
  titulo = "Pedidos";
  dataSource = new MatTableDataSource<Pedido>([]);
  expandedPedido: Pedido | null;
  displayedColumns = [
    "id",
    "proveedor",
    "fecha",
    "formaPago",
    "estado",
    "valorTotal",
    "responsable",
    "acciones"
  ];

  actualizarSub = new Subscription;

  constructor(
    private pedidoService: PedidoService,
    private matDialog: MatDialog,
    private tabService: TabService
  ) {}

  ngOnInit(): void {
    this.onGetAll()

    this.actualizarSub = this.pedidoService.actualizarSub.pipe(untilDestroyed(this)).subscribe(res => {
      if(res){
        this.onGetAll()
      }
    })
  }

  onGetAll(){
    this.pedidoService.onGetAll().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        this.dataSource.data = res;
        // this.openPedido(this.dataSource.data[0])
      }
    });
  }

  onAdd() {
    this.tabService.addTab(new Tab(EditPedidoComponent, 'Nuevo Pedido', null, null))
  }

  onFilter() {}

  openPedido(pedido: Pedido){
    this.tabService.addTab(new Tab(EditPedidoComponent, `Pedido ${pedido.id}`, new TabData(null, pedido), null))
  }

  ngOnDestroy(): void {
      this.actualizarSub.unsubscribe();
  }
}
