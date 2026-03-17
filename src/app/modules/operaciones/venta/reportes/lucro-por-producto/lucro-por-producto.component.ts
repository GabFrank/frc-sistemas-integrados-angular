import { Component, ElementRef, OnInit, ViewChild, Injectable } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { LucroPorProducto } from "./lucro-por-producto.model";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Sucursal } from "../../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../../empresarial/sucursal/sucursal.service";
import {
  combineDateTime,
  dateToString,
} from "../../../../../commons/core/utils/dateUtils";
import { ProductoService } from "../../../../productos/producto/producto.service";
import { MatDialog } from "@angular/material/dialog";
import { Producto } from "../../../../productos/producto/producto.model";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { NotificacionSnackbarService } from "../../../../../notificacion-snackbar.service";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
  TableData,
} from "../../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { PersonaService } from "../../../../personas/persona/persona.service";
import { PersonaSearchGQL } from "../../../../personas/persona/graphql/personaSearch";
import { Persona } from "../../../../personas/persona/persona.model";
import { UsuarioService } from "../../../../personas/usuarios/usuario.service";
import { Usuario } from "../../../../personas/usuarios/usuario.model";
import { UsuarioSearchPageGQL } from "../../../../personas/usuarios/graphql/usuarioSearchPage";
import { Subfamilia } from "../../../../productos/sub-familia/sub-familia.model";
import { SubfamiliasSearchGQL } from "../../../../productos/sub-familia/graphql/subfamiliasSearch";
import { SearchSubfamiliaByDescripcionGQL } from "../../../../productos/sub-familia/graphql/searchByDescripcion";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-lucro-por-producto",
  templateUrl: "./lucro-por-producto.component.html",
  styleUrls: ["./lucro-por-producto.component.scss"],
})
export class LucroPorProductoComponent implements OnInit {
  @ViewChild("buscadorInput", { static: true }) buscadorInput: ElementRef;
  @ViewChild("cajeroInput", { static: true })
  buscadorCajeroInput: ElementRef;

  dataSource = new MatTableDataSource<LucroPorProducto>([]);
  isLastPage = true;
  sucursalControl = new FormControl();
  fechaFormGroup: FormGroup;
  today = new Date();
  fechaInicioControl = new FormControl();
  fechaFinalControl = new FormControl();
  horaInicioControl = new FormControl("00:00");
  horaFinalControl = new FormControl("23:59");
  selectedSucursal: Sucursal;
  sucursalList: Sucursal[];
  sucursalIdList: number[];
  buscarProductoControl = new FormControl();
  buscarSubfamiliaControl = new FormControl();
  isPesable = false;
  selectedProducto: Producto;
  isDialogOpen = true;
  productoList: Producto[] = [];
  buscarCajeroControl = new FormControl();
  selectedUsuario: Usuario;
  selectedSubFamilia: Subfamilia;
  cajeroIdList: number[];

  displayedColumns: string[] = [
    "id",
    "descripcion",
    "cantidad",
    "costoUnitario",
    "ventaMedia",
    "costoTotal",
    "totalVenta",
    "totalDescuento",
    "totalAumento",
    "lucro",
    "margen",
  ];

  totalVenta = 0;
  totalCosto = 0;
  totalLucro = 0;
  totalDescuento = 0;
  totalAumento = 0;
  margenPromedio = 0;

  page = 0;
  size = 20;
  totalElements = 0;

  constructor(
    private sucursalService: SucursalService,
    private productoService: ProductoService,
    private dialog: MatDialog,
    private notificacionService: NotificacionSnackbarService,
    private personaService: PersonaService,
    private usuarioSearch: UsuarioSearchPageGQL,
    private usuarioService: UsuarioService,
    private searchSubfamilia: SearchSubfamiliaByDescripcionGQL,
    private matDialog: MatDialog
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

  onFiltrar(isPagination: boolean = false) {
    if (!isPagination) {
      this.page = 0;
    }
    if (this.fechaFormGroup.valid && this.sucursalControl.valid) {
      if (this.horaInicioControl.value == null)
        this.horaInicioControl.setValue("07:00");
      if (this.horaFinalControl.value == null)
        this.horaFinalControl.setValue("06:59");
      this.fechaInicioControl.setValue(
        combineDateTime(
          this.fechaInicioControl.value,
          this.horaInicioControl.value
        )
      );
      this.fechaFinalControl.setValue(
        combineDateTime(
          this.fechaFinalControl.value,
          this.horaFinalControl.value
        )
      );
      let fechaInicio = dateToString(this.fechaInicioControl.value);
      let fechaFin = dateToString(this.fechaFinalControl.value);
      let productoIdList: number[];
      this.productoList.forEach((p) => {
        if (productoIdList == null) productoIdList = [];
        productoIdList.push(p.id);
      });
      if (this.selectedUsuario != null) {
        this.cajeroIdList = [];
        this.cajeroIdList.push(this.selectedUsuario?.id);
      } else {
        this.cajeroIdList = [];
      }

      this.productoService
        .onGetLucroPorProducto(
          fechaInicio,
          fechaFin,
          this.toSucursalesId(this.sucursalControl.value),
          this.cajeroIdList,
          productoIdList,
          this.selectedSubFamilia?.id,
          this.page,
          this.size
        )
        .subscribe((res) => {
          console.log('Data received:', res);
          if (res) {
            this.dataSource.data = res.content || [];
            this.totalElements = res.totalElements || 0;
            if (res.summary) {
              this.populateSummary(res.summary);
            }
          }
        });
    }
  }

  handlePageEvent(e: any) {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.onFiltrar(true);
  }

  populateSummary(summary: any) {
    this.totalVenta = summary.totalVenta || 0;
    this.totalCosto = summary.costoTotal || 0;
    this.totalLucro = summary.lucro || 0;
    this.totalDescuento = summary.totalDescuento || 0;
    this.totalAumento = summary.totalAumento || 0;
    this.margenPromedio = summary.margen || 0;
  }

  cargarMasDatos() {}

  resetFiltro() {
    this.fechaInicioControl.setValue(null);
    this.fechaFinalControl.setValue(null);
    this.sucursalList = [];
    this.sucursalIdList = [];
  }

  onGenerarPdf() {
    if (this.horaInicioControl.value == null)
      this.horaInicioControl.setValue("07:00");
    if (this.horaFinalControl.value == null)
      this.horaFinalControl.setValue("06:59");
    this.fechaInicioControl.setValue(
      combineDateTime(
        this.fechaInicioControl.value,
        this.horaInicioControl.value
      )
    );
    this.fechaFinalControl.setValue(
      combineDateTime(this.fechaFinalControl.value, this.horaFinalControl.value)
    );
    let fechaInicio = dateToString(this.fechaInicioControl.value);
    let fechaFin = dateToString(this.fechaFinalControl.value);
    let productoIdList: number[];
    this.productoList.forEach((p) => {
      if (productoIdList == null) productoIdList = [];
      productoIdList.push(p.id);
    });
    if (this.selectedUsuario != null) {
      this.cajeroIdList = [];
      this.cajeroIdList.push(this.selectedUsuario?.id);
    } else {
      this.cajeroIdList = [];
    }
    this.productoService.onImprimirReporteLucroPorProducto(
      fechaInicio,
      fechaFin,
      this.toSucursalesId(this.sucursalControl.value),
      this.cajeroIdList,
      productoIdList,
      this.selectedSubFamilia?.id
    );
  }

  toSucursalesId(sucursales: Sucursal[]) {
    let idList = [];
    if (sucursales == null) sucursales = this.sucursalList;
    sucursales?.forEach((s) => idList.push(s?.id));
    return idList;
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
        this.onAddProducto();
      });
  }

  onAddProducto() {
    console.log("log add producto");

    // if (this.selectedProducto != null) {
    //   if (this.productoList.find(p => p.id = this.selectedProducto.id) == null) {
    this.productoList.push(this.selectedProducto);
    this.buscarProductoControl.setValue(null);
    this.selectedProducto = null;
    this.buscadorInput.nativeElement.focus();
    //   } else {
    //     this.notificacionService.openWarn("Este producto ya fue seleccionado")
    //     this.buscadorInput.nativeElement.select()
    //   }
    // }
  }

  onClearProducto(producto: Producto, index) {
    this.productoList.splice(index, 1);
  }

  onBuscarCajero() {
    let data: SearchListtDialogData = {
      titulo: "Buscar Cajero",
      query: this.usuarioSearch,
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "nickname", nombre: "Nombre", width: "90%" },
      ],
      texto: this.buscarCajeroControl.value,
      search: true,
      inicialSearch: true,
      paginator: true,
      searchFieldName: 'texto',
    };
    // data.
    this.dialog
      .open(SearchListDialogComponent, {
        data,
        width: "50%",
        height: "80%",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: Usuario) => {
        if (res != null) {
          this.usuarioService
            .onGetUsuario(res.id)
            .pipe(untilDestroyed(this))
            .subscribe((resUsuario) => {
              if (resUsuario != null) {
                this.selectedUsuario = resUsuario;
                this.buscarCajeroControl.setValue(res.id + " - " + res.nickname);
              } else {
                this.notificacionService.openWarn(
                  "No posee usuario registrado"
                );
                this.buscadorCajeroInput.nativeElement.select();
              }
            });
        }
      });
  }

  onBuscarSubFamilia() {
    let tableData: TableData[] = [
          {
            id: "id",
            nombre: "Id",
          },
          {
            id: "nombre",
            nombre: "Familia",
            nested: true,
            nestedId: "familia",
            nestedColumnId: "familia",
          },
          {
            id: "nombre",
            nombre: "Nombre",
          },
        ];
        let data: SearchListtDialogData = {
          query: this.searchSubfamilia,
          tableData: tableData,
          titulo: "Buscar subfamilia",
          search: true,
          queryData: { texto: this.buscarSubfamiliaControl.value },
          inicialSearch: true,
          paginator: true,
        };
        this.matDialog
          .open(SearchListDialogComponent, {
            data: data,
            width: "60%",
            height: "80%",
          })
          .afterClosed()
          .subscribe((res: Subfamilia | any) => {
            if (res != null) {
              this.selectedSubFamilia = res;
              this.buscarSubfamiliaControl.setValue(res.nombre);
            }
          });
  }

  onClearSubFamilia() {
    this.selectedSubFamilia = null;
    this.buscarSubfamiliaControl.setValue(null);
  }

  onClearPersona() {
    this.selectedUsuario = null;
    this.buscarCajeroControl.setValue(null);
    this.buscadorCajeroInput.nativeElement.focus();
  }
}