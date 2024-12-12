import {
  animate, state,
  style,
  transition, trigger
} from "@angular/animations";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { from, Subscription } from "rxjs";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { EditPedidoComponent } from "../edit-pedido/edit-pedido.component";
import { Pedido } from "../edit-pedido/pedido.model";
import { PedidoService } from "../pedido.service";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { PageInfo } from "../../../../app.component";
import { FormControl } from "@angular/forms";
import { dateToString } from "../../../../commons/core/utils/dateUtils";

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

  @ViewChild(MatPaginator) paginator: MatPaginator;

  estadoControl = new FormControl();
  sucursalControl = new FormControl();
  inicioControl = new FormControl();
  finControl = new FormControl();
  proveedorControl = new FormControl();
  vendedorControl = new FormControl();
  formaPagoControl = new FormControl();
  productoControl = new FormControl();


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



  length = 25;
  page = 25;
  size = 0;
  pageEvent: PageEvent;
  orderById = null;
  orderByNombre = null;
  selectedPageInfo: PageInfo<Pedido>;

  actualizarSub = new Subscription;

  constructor(
    private pedidoService: PedidoService,
    private matDialog: MatDialog,
    private tabService: TabService
  ) { }

  ngOnInit(): void {

    let fechaInicial = new Date();
    fechaInicial.setHours(0,0,0,0);
    fechaInicial.setDate((new Date()).getDate() - 5);
    let fechaFinal = new Date();
    fechaFinal.setHours(23,59,59,999);

    this.inicioControl.setValue(fechaInicial);
    this.finControl.setValue(fechaFinal);

    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1])
      this.size = this.paginator.pageSizeOptions[1]
      this.onFiltrar()
    }, 0);

  }

  onFiltrar(){
    this.pedidoService.onFilterPedidos(
      this.estadoControl.value,
      this.sucursalControl.value,
      dateToString(this.inicioControl.value),
      dateToString(this.finControl.value),
      this.proveedorControl.value,
      this.vendedorControl.value,
      this.formaPagoControl.value,
      this.productoControl.value,
      this.page,
      this.size
    ).subscribe(res => {
      if(res!=null){
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent;
      }
    })
  }

  onGetAll() {
    this.pedidoService.onGetAll().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        this.dataSource.data = res;
      }
    });
  }

  onAdd() {
    this.tabService.addTab(new Tab(EditPedidoComponent, 'Nuevo Pedido', null, null))
  }

  onFilter() { }

  openPedido(pedido: Pedido) {
    this.tabService.addTab(new Tab(EditPedidoComponent, `Pedido ${pedido.id}`, new TabData(pedido.id, {id: pedido.id}), ListPedidoComponent))
  }

  ngOnDestroy(): void {
  }

  handlePageEvent(e: PageEvent) {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.onFiltrar();
  }
}
