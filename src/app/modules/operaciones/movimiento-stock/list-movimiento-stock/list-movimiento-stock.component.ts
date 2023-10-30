import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { WindowInfoService } from "../../../../shared/services/window-info.service";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../productos/producto/producto.model";
import { MovimientoStock } from "../movimiento-stock.model";
import { MovimientoStockService } from "../movimiento-stock.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { TipoMovimiento } from "../movimiento-stock.enums";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import {
  dateToString,
  getFirstDayOfCurrentWeek,
  getFirstDayOfMonths,
  getLastDayOfCurrentWeek,
  getLastDayOfMonths,
} from "../../../../commons/core/utils/dateUtils";
import { ProductoService } from "../../../productos/producto/producto.service";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { UsuarioService } from "../../../personas/usuarios/usuario.service";
import { UsuarioSearchGQL } from "../../../personas/usuarios/graphql/usuarioSearch";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { PageInfo } from "../../../../app.component";
import { PageEvent } from "@angular/material/paginator";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-movimiento-stock",
  templateUrl: "./list-movimiento-stock.component.html",
  styleUrls: ["./list-movimiento-stock.component.scss"],
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
export class ListMovimientoStockComponent implements OnInit {
  @ViewChild("buscadorInput", { static: true }) buscadorInput: ElementRef;
  @ViewChild("buscadorUsuarioInput", { static: true })
  buscadorUsuarioInput: ElementRef;

  dataSource = new MatTableDataSource<MovimientoStock>(null);
  expandedMovimiento: MovimientoStock;
  displayedColumns = [
    "id",
    "producto",
    "cantidad",
    "tipo",
    "estado",
    "fecha",
    "acciones",
  ];
  fechaInicioControl = new FormControl();
  fechaFinalControl = new FormControl();
  horaInicioControl = new FormControl("00:00");
  horaFinalControl = new FormControl("23:59");
  buscarProductoControl = new FormControl();
  tipoMovimientoControl = new FormControl();
  buscarUsuarioControl = new FormControl();
  sucursalControl = new FormControl();
  referenciaControl = new FormControl();
  tipoMovimientoList: TipoMovimiento[] = Object.keys(TipoMovimiento).map(
    (key) => TipoMovimiento[key]
  );
  tableHeight;
  selectedProducto: Producto;
  productoList: Producto[] = [];
  selectedUsuario: Usuario;
  fechaFormGroup: FormGroup;
  today = new Date();
  sucursalList: Sucursal[];
  sucursalIdList: number[];
  productoIdList: number[];
  isDialogOpen = false;
  isPesable = false;
  page = 0;
  size = 20;
  selectedPageInfo: PageInfo<MovimientoStock>

  constructor(
    private service: MovimientoStockService,
    private matDialog: MatDialog,
    private windowInfoService: WindowInfoService,
    private sucursalService: SucursalService,
    private productoService: ProductoService,
    private dialog: MatDialog,
    private usuarioSearch: UsuarioSearchGQL,
    private usuarioService: UsuarioService,
    private notificacionService: NotificacionSnackbarService
  ) {
    this.tableHeight = windowInfoService.innerHeight * 0.6;
  }

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

  onGetMovimientos() {
    this.sucursalIdList = this.toEntityId(
      this.sucursalControl.value,
      this.sucursalList
    );
    if(this.tipoMovimientoControl.value?.find(i => i == 'Todas') != null){
      this.tipoMovimientoControl.setValue(null);
    }
    this.service
      .onGetMovimientoStockPorFiltros(
        dateToString(this.fechaInicioControl.value),
        dateToString(this.fechaFinalControl.value),
        this.sucursalIdList,
        this.selectedProducto?.id,
        this.tipoMovimientoControl.value,
        this.selectedUsuario?.id,
        this.page,
        this.size
      )
      .subscribe((res) => {
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent;
        console.log(res.getContent);
        
      });
  }
  onReferenciaClick(movimiento: MovimientoStock) {
    console.log(movimiento);
    this.matDialog.open(
      this.service.getTipoMovimientoComponent(movimiento.tipoMovimiento),
      {
        data: {
          id: movimiento.referencia,
        },
        width: "80%",
        height: "80%",
      }
    );
  }

  resetFilters() {}

  onSelectProducto(producto) {}

  onBuscarProducto() {
    // let text: string = this.buscarProductoControl.value;
    // if (
    //   this.selectedProducto != null &&
    //   text.includes(this.selectedProducto.descripcion)
    // ) {
    //   this.onAddProducto();
    // } else {
    //   this.onSearchPorCodigo();
    // }
    this.onSearchPorCodigo();

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
          this.buscarProductoControl.setValue(
            this.selectedProducto.id + " - " + this.selectedProducto.descripcion
          );
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
        this.buscarProductoControl.setValue(
          this.selectedProducto.id + " - " + this.selectedProducto.descripcion
        );
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

  onFiltrar() {
    this.onGetMovimientos();
  }

  resetFiltro() {}

  onGenerarPdf() {}

  onCancelarFiltro() {}

  onBuscarUsuario() {
    let data: SearchListtDialogData = {
      titulo: "Buscar usuario",
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
          this.usuarioService
            .onGetUsuarioPorPersonaId(res.id)
            .pipe(untilDestroyed(this))
            .subscribe((resUsuario) => {
              if (resUsuario != null) {
                this.selectedUsuario = resUsuario;
                this.buscarUsuarioControl.setValue(
                  res.id + " - " + res.nickname
                );
              } else {
                this.notificacionService.openWarn(
                  "No posee usuario registrado"
                );
                this.buscadorInput.nativeElement.select();
              }
            });
        }
      });
  }

  onClearUsuario() {
    this.selectedUsuario = null;
    this.buscarUsuarioControl.setValue(null);
    this.buscadorUsuarioInput.nativeElement.focus();
  }

  cambiarFecha(dias: string) {
    switch (dias) {
      case "dia":
        this.fechaInicioControl.setValue(getFirstDayOfCurrentWeek());
        this.fechaFinalControl.setValue(getLastDayOfCurrentWeek());
        break;
      case "mes":
        this.fechaInicioControl.setValue(getFirstDayOfMonths(-1));
        this.fechaFinalControl.setValue(getLastDayOfMonths(-1));
        break;
      case "2mes":
        this.fechaInicioControl.setValue(getFirstDayOfMonths(-2));
        this.fechaFinalControl.setValue(getLastDayOfMonths(-2));
        break;
      case "3mes":
        this.fechaInicioControl.setValue(getFirstDayOfMonths(-3));
        this.fechaFinalControl.setValue(getLastDayOfMonths(-3));
        break;
      default:
        break;
    }
  }

  toEntityId(entity: any[], sourceListId: any[]) {
    let idList = [];
    if (entity == null) entity = sourceListId;
    entity?.forEach((s) => idList.push(s?.id));
    return idList;
  }

  handlePageEvent(e: PageEvent) {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.onFiltrar();
  }
}
