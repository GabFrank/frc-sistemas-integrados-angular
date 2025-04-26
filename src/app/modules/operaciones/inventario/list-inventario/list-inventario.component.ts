import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { UsuarioSearchGQL } from "../../../personas/usuarios/graphql/usuarioSearch";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../productos/producto/producto.model";
import { ProductoService } from "../../../productos/producto/producto.service";
import { InventarioProductoItem } from "../inventario.model";
import { InventarioService } from "../inventario.service";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { PageInfo } from "../../../../app.component";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { ProductoComponent } from "../../../productos/producto/edit-producto/producto.component";
import { PageEvent } from "@angular/material/paginator";
import { stringToTime } from "../../../../commons/core/utils/string-utils";

export interface OrderList {
  nombre: string;
  value: string;
  tipo: TipoOrder[];
}

export interface TipoOrder {
  nombre: string;
  value: string;
}

@UntilDestroy()
@Component({
  selector: "app-list-inventario",
  templateUrl: "./list-inventario.component.html",
  styleUrls: ["./list-inventario.component.scss"],
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
export class ListInventarioComponent implements OnInit {
  @ViewChild("buscarUsuarioInput", { static: true })
  buscadorUsuarioInput: ElementRef;
  @ViewChild("buscadorInput", { static: true }) buscadorInput: ElementRef;

  dataSource = new MatTableDataSource<InventarioProductoItem>([]);
  expandedInventarioProductoItem: InventarioProductoItem;
  isDialogOpen = false;
  ordenarPorControl = new FormControl();
  tipoOrdenControl = new FormControl();
  selectedPageInfo: PageInfo<InventarioProductoItem>;
  length = 15;
  pageSize = 15;
  pageIndex = 0;

  fechaFormGroup: FormGroup;
  today = new Date();
  fechaInicioControl = new FormControl();
  fechaFinalControl = new FormControl();
  horaInicioControl = new FormControl("00:00");
  horaFinalControl = new FormControl("23:59");

  sucursalControl = new FormControl();
  sucursalList: Sucursal[];
  sucursalIdList: number[];

  selectedUsuario: Usuario;
  buscarUsuarioControl = new FormControl();

  productoList: Producto[] = [];
  buscarProductoControl = new FormControl();
  isPesable = false;
  selectedProducto: Producto;

  displayedColumns = [
    "descripcion", //producto
    "codigo", //producto
    "cantidadSistema", //que deberia haber en stock - No esta guardando
    "cantidadFisica", //encontrada en stock
    "saldo", //diferencia inventario
    "texto", //explicito diciendo (falta, sobra)
    "usuario",
    "creadoEn",
    "sucursal"
  ];

  orderList: OrderList[] = [
    {
      nombre: "Descripción",
      value: "presentacion.producto.descripcion",
      tipo: [
        {
          nombre: "A-Z",
          value: "ASC",
        },
        {
          nombre: "Z-A",
          value: "DESC",
        },
      ],
    },
    {
      nombre: "Fecha",
      value: "creadoEn",
      tipo: [
        {
          nombre: "Menor a mayor",
          value: "ASC",
        },
        {
          nombre: "Mayor a menor",
          value: "DESC",
        },
      ],
    }
    
  ];

  constructor(
    private sucursalService: SucursalService,
    private usuarioSearch: UsuarioSearchGQL,
    private dialog: MatDialog,
    private productoService: ProductoService,
    private inventarioService: InventarioService,
    private tabService: TabService
  ) {}

  ngOnInit(): void {
    let hoy = new Date();
    let aux = new Date();
    aux.setDate(hoy.getDate() - 2);

    this.fechaInicioControl.setValue(aux);
    this.fechaFinalControl.setValue(hoy);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinalControl,
      inicioHora: this.horaInicioControl,
      finHora: this.horaFinalControl,
    });

    this.sucursalList = [];
    this.sucursalIdList = [];

    setTimeout(() => {
      this.sucursalService
        .onGetAllSucursales()
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.sucursalList = res.filter((s) => {
            if (s.id != 0) {
              this.sucursalIdList.push(s.id);
              return s;
            }
          });
        });
    });
  }

  onFiltrar() {
    let productoIdList: number[];
    this.productoList.forEach((p) => {
      if (productoIdList == null) productoIdList = [];
      productoIdList.push(p.id);
    });

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
    
    this.inventarioService
      .onGetInventarioProductoItemWithFilters(
        dateToString(fechaInicial),
        dateToString(fechaFin),
        this.pageIndex,
        this.pageSize,
        this.ordenarPorControl.value?.value,
        this.tipoOrdenControl.value?.value,
        this.toSucursalesId(this.sucursalControl.value),
        this.selectedUsuario != null ? [this.selectedUsuario.id] : null,
        productoIdList
      )
      .pipe(untilDestroyed(this))
      .subscribe((res: PageInfo<InventarioProductoItem>) => {
        console.log(res.getContent);
        
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent;
      });
  }

  onVer(inventarioProductoItem: InventarioProductoItem) {}

  onRowClick(row, i) {}

  onBuscarUsuario() {
    let data: SearchListtDialogData = {
      titulo: "Buscar Persona",
      query: this.usuarioSearch,
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "nickname", nombre: "Nombre", width: "70%" },
      ],
      texto: this.buscarUsuarioControl.value,
      search: true,
      inicialSearch: true,
    };
    // data.
    this.dialog
      .open(SearchListDialogComponent, {
        data,
        height: "80%",
        width: "80%",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: Usuario) => {
        if (res != null) {
          this.selectedUsuario = res;
        }
      });
  }

  onClearUsuario() {
    this.selectedUsuario = null;
    this.buscarUsuarioControl.setValue(null);
    this.buscadorUsuarioInput.nativeElement.focus();
  }

  onBuscarProducto() {
    let text: string = this.buscarProductoControl.value;
    if (
      this.selectedProducto != null &&
      text.includes(this.selectedProducto.descripcion)
    ) {
      this.onAddProducto();
    } else {
      this.onSearchPorCodigo();
    }
  }

  onSearchPorCodigo() {
    let text = this.buscarProductoControl.value;
    this.isPesable = false;
    let peso;
    let codigo;
    if (text?.length == 13 && text.substring(0, 2) == "20") {
      this.isPesable = true;
      codigo = text.substring(2, 7);
      peso = +text.substring(7, 12) / 1000;
      text = codigo;
    }
    if (text != null) {
      this.productoService.onGetProductoPorCodigo(text).subscribe((res) => {
        if (res != null) {
          this.selectedProducto = res;
          this.onAddProducto();
        } else {
          this.openSearchProducto(text);
        }
      });
    } else {
      this.openSearchProducto(text);
    }
  }

  openSearchProducto(texto?) {
    this.isDialogOpen = true;
    let data: PdvSearchProductoData = {
      texto: texto,
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true,
    };
    this.dialog
      .open(PdvSearchProductoDialogComponent, {
        data: data,
        height: "80%",
      })
      .afterClosed()
      .subscribe((res) => {
        this.isDialogOpen = false;
        let response: PdvSearchProductoResponseData = res;
        this.selectedProducto = response.producto;
        this.onAddProducto();
      });
  }

  onAddProducto() {
    this.productoList.push(this.selectedProducto);
    this.buscarProductoControl.setValue(null);
    this.selectedProducto = null;
    this.buscadorInput.nativeElement.focus();
  }

  onClearProducto(producto: Producto, index) {
    this.productoList.splice(index, 1);
  }

  onOrderSelect() {
    if (this.ordenarPorControl.value != null) {
      this.tipoOrdenControl.setValue(this.ordenarPorControl.value.tipo[0]);
    }
  }

  toSucursalesId(sucursales: Sucursal[]) {
    let idList = [];
    if (sucursales == null) sucursales = this.sucursalList;
    sucursales?.forEach((s) => idList.push(s?.id));
    return idList;
  }

  irAProducto(producto) {
    this.tabService.addTab(
      new Tab(
        ProductoComponent,
        producto.descripcion.toUpperCase(),
        new TabData(null, producto)
      )
    );
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onGenerarPdf(){
    let productoIdList: number[];
    this.productoList.forEach((p) => {
      if (productoIdList == null) productoIdList = [];
      productoIdList.push(p.id);
    });
    if(this.fechaFinalControl.value != null && this.fechaFinalControl.value != null){
      this.inventarioService.onGetReporteInventario(
        dateToString(this.fechaInicioControl.value),
        dateToString(this.fechaFinalControl.value),
        this.pageIndex,
        this.pageSize,
        this.ordenarPorControl.value?.value,
        this.tipoOrdenControl.value?.value,
        null,
        this.toSucursalesId(this.sucursalControl.value),
        this.selectedUsuario != null ? [this.selectedUsuario.id] : null,
        productoIdList,
      )
    }
  }
}
