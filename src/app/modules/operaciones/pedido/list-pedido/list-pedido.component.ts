import {
  animate,
  state,
  style,
  transition,
  trigger,
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

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { PageInfo } from "../../../../app.component";
import { FormControl, FormGroup } from "@angular/forms";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { SelectionModel } from "@angular/cdk/collections";
import { ProveedorService } from "../../../personas/proveedor/proveedor.service";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { AdicionarProveedorDialogComponent } from "../../../personas/proveedor/adicionar-proveedor-dialog/adicionar-proveedor-dialog.component";
import { stringToTime } from "../../../../commons/core/utils/string-utils";
import { PedidoEstado } from "../edit-pedido/pedido-enums";
import { PagoPedidoDialogComponent } from "../pago-pedido-dialog/pago-pedido-dialog.component";
import { EditPedido2Component } from "../edit-pedido-2/edit-pedido-2.component";

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

  idPedidoControl = new FormControl();
  numeroDeNotaRecepcionControl = new FormControl();
  estadoControl = new FormControl();
  sucursalControl = new FormControl();
  proveedorControl = new FormControl();
  vendedorControl = new FormControl();
  formaPagoControl = new FormControl();
  productoControl = new FormControl();
  buscarProveedorControl = new FormControl();
  selectedProveedor: Proveedor;
  selectionPedido = new SelectionModel<Pedido>(true, []);
  isAllSelected = false;
  isValidForPago = false;
  titulo = "Pedidos";
  dataSource = new MatTableDataSource<Pedido>([]);
  expandedPedido: Pedido | null;
  displayedColumns = [
    "id",
    "proveedor",
    "fecha",
    "formaPago",
    "estado",
    "pagado",
    "valorTotal",
    "responsable",
    "acciones",
  ];
  estadoList = Object.values(PedidoEstado);

  length = 25;
  page = 25;
  size = 0;
  pageEvent: PageEvent;
  orderById = null;
  orderByNombre = null;
  selectedPageInfo: PageInfo<Pedido>;

  actualizarSub = new Subscription();

  fechaInicioControl = new FormControl();
  fechaFinalControl = new FormControl();
  horaInicioControl = new FormControl("00:00");
  horaFinalControl = new FormControl("23:59");
  fechaFormGroup: FormGroup;

  today = new Date();

  constructor(
    private pedidoService: PedidoService,
    private matDialog: MatDialog,
    private tabService: TabService,
    private proveedorService: ProveedorService
  ) {}

  ngOnInit(): void {
    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinalControl,
      inicioHora: this.horaInicioControl,
      finHora: this.horaFinalControl,
    });

    this.onResetFiltro();

    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1]);
      this.size = this.paginator.pageSizeOptions[1];
      this.onFiltrar();
    }, 0);

    this.idPedidoControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.numeroDeNotaRecepcionControl.disable();
          this.proveedorControl.disable();
          this.vendedorControl.disable();
          this.fechaFormGroup.disable();
          this.horaInicioControl.disable();
          this.horaFinalControl.disable();
          this.estadoControl.disable();
        } else {
          this.numeroDeNotaRecepcionControl.enable();
          this.proveedorControl.enable();
          this.vendedorControl.enable();
          this.fechaFormGroup.enable();
          this.horaInicioControl.enable();
          this.horaFinalControl.enable();
          this.estadoControl.enable();
        }
      });

    this.numeroDeNotaRecepcionControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.proveedorControl.disable();
          this.vendedorControl.disable();
          this.fechaFormGroup.disable();
          this.horaInicioControl.disable();
          this.horaFinalControl.disable();
          this.estadoControl.disable();
        } else {
          this.proveedorControl.enable();
          this.vendedorControl.enable();
          this.fechaFormGroup.enable();
          this.horaInicioControl.enable();
          this.horaFinalControl.enable();
          this.estadoControl.enable();
        }
      });
  }

  onFiltrar() {
    this.selectionPedido.clear();
    let fechaInicial: Date = this.fechaInicioControl.value;
    let fechaFin: Date = this.fechaFinalControl.value;
    let horaInicial: Date = stringToTime(this.horaInicioControl.value);
    let horaFinal: Date = stringToTime(this.horaFinalControl.value);
    fechaInicial.setHours(horaInicial.getHours());
    fechaInicial.setMinutes(horaInicial.getMinutes());
    fechaInicial.setSeconds(horaInicial.getSeconds());
    fechaFin.setHours(horaFinal.getHours());
    fechaFin.setMinutes(horaFinal.getMinutes());
    fechaFin.setSeconds(horaFinal.getSeconds());

    this.pedidoService
      .onFilterPedidos(
        this.idPedidoControl.value,
        this.numeroDeNotaRecepcionControl.value,
        this.estadoControl.value,
        this.sucursalControl.value,
        dateToString(fechaInicial),
        dateToString(fechaFin),
        this.selectedProveedor?.id,
        this.vendedorControl.value,
        this.formaPagoControl.value,
        this.productoControl.value,
        this.page,
        this.size
      )
      .subscribe((res) => {
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource.data = res.getContent;
        }
      });
  }

  onGetAll() {
    this.pedidoService
      .onGetAll()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = res;
        }
      });
  }

  onAdd() {
    this.tabService.addTab(
      new Tab(EditPedido2Component, "Nuevo Pedido", null, null)
    );
  }

  onFilter() {}

  openPedido(pedido: Pedido) {
    this.tabService.addTab(
      new Tab(
        EditPedido2Component,
        `Pedido ${pedido.id}`,
        new TabData(pedido.id, { id: pedido.id }),
        ListPedidoComponent
      )
    );
  }

  onBuscarProveedor() {
    if (this.buscarProveedorControl.valid) {
      //verificar si se ingreso algun texto en el buscador
      let texto: string = this.buscarProveedorControl.value;
      if (!isNaN(+texto)) {
        //verificar si el texto es un numero (ID)
        this.proveedorService
          .onGetPorId(+texto)
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            this.onSelectProveedor(res);
          });
      } else if (
        this.selectedProveedor != null &&
        texto.includes(this.selectedProveedor.persona.nombre)
      ) {
      } else {
        this.onSearchProveedorPorTexto(this.buscarProveedorControl.value);
      }
    } else {
      this.onSearchProveedorPorTexto(this.buscarProveedorControl.value);
    }
  }

  onSearchProveedorPorTexto(texto) {
    this.proveedorService.onSearchProveedorPorTexto(texto).subscribe((res) => {
      if (res != null) {
        this.onSelectProveedor(res);
      }
    });
  }

  onSelectProveedor(proveedor: Proveedor) {
    if (proveedor != null) {
      this.selectedProveedor = proveedor;
      this.buscarProveedorControl.setValue(
        this.selectedProveedor.id +
          " - " +
          this.selectedProveedor.persona.nombre
      );
    } else {
      this.selectedProveedor = null;
      this.buscarProveedorControl.setValue(null, { emitEvent: false });
    }
  }

  onClearProveedor() {
    this.onSelectProveedor(null);
  }

  ngOnDestroy(): void {}

  handlePageEvent(e: PageEvent) {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.onFiltrar();
  }

  masterToggle() {
    let numSelected = this.selectionPedido.selected.length;
    let numRows = this.dataSource.data.length;
    this.isAllSelected = numSelected === numRows;

    this.isAllSelected
      ? this.selectionPedido.clear()
      : this.dataSource.data.forEach((row) => this.selectionPedido.select(row));

    numSelected = this.selectionPedido.selected.length;
    numRows = this.dataSource.data.length;
    this.isAllSelected = numSelected === numRows;
    this.checkIfValidForPago();
  }

  checkIfValidForPago() {
    this.isValidForPago = false;
    if (!this.selectionPedido?.selected?.length) {
      this.isValidForPago = false; // No elements in the array, return false
    } else if (
      this.selectionPedido?.selected?.length == 1 &&
      this.selectionPedido?.selected[0].estado !== "ABIERTO" &&
      !this.selectionPedido?.selected[0].pagado
    ) {
      this.isValidForPago = true;
    } else {
      const firstProveedorId = this.selectionPedido.selected[0].proveedor.id;

      this.isValidForPago = this.selectionPedido.selected.every(
        (item) =>
          item.proveedor.id === firstProveedorId &&
          item.estado !== "ABIERTO" &&
          !item.pagado
      );
    }
  }

  irAPago() {
    this.matDialog.open(PagoPedidoDialogComponent, {
      width: "80%",
      height: "80%",
      data: {
        pedidos: this.selectionPedido.selected,
      },
    });
  }

  onResetFiltro() {
    this.proveedorControl.setValue(null);
    let hoy = new Date();
    let aux = new Date();
    aux.setDate(hoy.getDate() - 2);
    this.fechaInicioControl.setValue(aux);
    this.fechaFinalControl.setValue(hoy);
    this.horaInicioControl.setValue("00:00");
    this.horaFinalControl.setValue("23:59");
    this.estadoControl.setValue(null);
    this.selectedProveedor = null;
    this.dataSource.data = [];
    this.selectionPedido.clear();
  }
}
