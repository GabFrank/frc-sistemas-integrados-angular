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
import { UsuarioSearchGQL } from "../../../../personas/usuarios/graphql/usuarioSearch";
import { Subfamilia } from "../../../../productos/sub-familia/sub-familia.model";
import { SubfamiliasSearchGQL } from "../../../../productos/sub-familia/graphql/subfamiliasSearch";
import { SearchSubfamiliaByDescripcionGQL } from "../../../../productos/sub-familia/graphql/searchByDescripcion";
import { FuncionarioSearchGQL } from "../../../../personas/funcionarios/graphql/funcionarioSearch";
import { Funcionario } from "../../../../personas/funcionarios/funcionario.model";
import { Familia } from "../../../../productos/familia/familia.model";
import { FamiliasSearchGQL } from "../../../../productos/familia/graphql/familiasSearch";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { PaginaCentral, PaginacionLista } from "../../../../../shared/components/paginacion/paginacion-lista";

/** La página del reporte trae además el resumen de todo el período. */
type PaginaLucro = PaginaCentral<LucroPorProducto> & { summary?: any };

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
  previousSelectedSucursales: any[] = [];
  buscarProductoControl = new FormControl();
  buscarSubfamiliaControl = new FormControl();
  isPesable = false;
  selectedProducto: Producto;
  isDialogOpen = true;
  productoList: Producto[] = [];
  buscarCajeroControl = new FormControl();
  selectedUsuario: Usuario;
  selectedSubFamilia: Subfamilia;
  selectedFamilia: Familia;
  buscarFamiliaControl = new FormControl();
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

  /** Filtros del último Filtrar: los cambios de página los repiten aunque el formulario haya cambiado. */
  private filtrosAplicados: {
    fechaInicio: string; fechaFin: string; sucursalIdList: number[]; usuarioIdList: number[];
    productoIdList: number[]; subfamiliaId: number; familiaId: number;
  };

  /** Lucro paginado en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag: PaginacionLista<LucroPorProducto> = new PaginacionLista<LucroPorProducto>({
    cargar: (page, size) => this.consultar(page, size),
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    alCargar: (res) => {
      this.dataSource.data = res.getContent ?? [];
      const summary = (res as PaginaLucro).summary;
      if (summary) {
        this.populateSummary(summary);
      }
    },
    // Filtro nuevo sin respuesta: ni filas ni resumen del filtro anterior (#390).
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) this.vaciarReporte();
    },
  });

  constructor(
    private sucursalService: SucursalService,
    private productoService: ProductoService,
    private dialog: MatDialog,
    private notificacionService: NotificacionSnackbarService,
    private personaService: PersonaService,
    private funcionarioSearch: FuncionarioSearchGQL,
    private usuarioService: UsuarioService,
    private searchSubfamilia: SearchSubfamiliaByDescripcionGQL,
    private searchSubfamiliaFiltered: SubfamiliasSearchGQL,
    private searchFamilia: FamiliasSearchGQL,
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

    this.sucursalControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((selectedValues: any[]) => {
        if (!selectedValues) return;
        const hasTodas = selectedValues.includes(null);
        if (hasTodas && selectedValues.length > 1) {
          const prevValues = this.previousSelectedSucursales || [];
          const hadTodasPrev = prevValues.includes(null);

          if (!hadTodasPrev) {
            this.previousSelectedSucursales = [null];
            this.sucursalControl.setValue([null], { emitEvent: false });
          } else {
            const newSelection = selectedValues.filter(val => val !== null);
            this.previousSelectedSucursales = newSelection;
            this.sucursalControl.setValue(newSelection, { emitEvent: false });
          }
        } else {
          this.previousSelectedSucursales = selectedValues;
        }
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
      let productoIdList: number[];
      this.productoList.forEach((p) => {
        if (productoIdList == null) productoIdList = [];
        productoIdList.push(p.id);
      });
      this.cajeroIdList = this.selectedUsuario != null ? [this.selectedUsuario.id] : [];

      this.filtrosAplicados = {
        fechaInicio: dateToString(this.fechaInicioControl.value),
        fechaFin: dateToString(this.fechaFinalControl.value),
        sucursalIdList: this.toSucursalesId(this.sucursalControl.value),
        usuarioIdList: this.cajeroIdList,
        productoIdList,
        subfamiliaId: this.selectedSubFamilia?.id,
        familiaId: this.selectedFamilia?.id,
      };
      this.pag.filtrar();
    }
  }

  private consultar(page: number, size: number): Observable<PaginaLucro | null> {
    const f = this.filtrosAplicados;
    return this.productoService
      .onGetLucroPorProducto(
        f.fechaInicio, f.fechaFin, f.sucursalIdList, f.usuarioIdList, f.productoIdList, f.subfamiliaId,
        page, size, f.familiaId
      )
      .pipe(
        map((res) => res ? { getContent: res.content || [], getTotalElements: res.totalElements || 0, summary: res.summary } : null),
        catchError(() => of(null))
      );
  }

  private vaciarReporte(): void {
    this.dataSource.data = [];
    this.totalVenta = 0;
    this.totalCosto = 0;
    this.totalLucro = 0;
    this.totalDescuento = 0;
    this.totalAumento = 0;
    this.margenPromedio = 0;
  }

  populateSummary(summary: any) {
    this.totalVenta = summary.totalVenta || 0;
    this.totalCosto = summary.costoTotal || 0;
    this.totalLucro = summary.lucro || 0;
    this.totalDescuento = summary.totalDescuento || 0;
    this.totalAumento = summary.totalAumento || 0;
    this.margenPromedio = summary.margen || 0;
  }

  resetFiltro() {
    let hoy = new Date();
    let aux = new Date();
    aux.setDate(hoy.getDate() - 2);

    this.fechaInicioControl.setValue(aux);
    this.fechaFinalControl.setValue(hoy);
    this.horaInicioControl.setValue("00:00");
    this.horaFinalControl.setValue("23:59");
    this.sucursalControl.setValue(null);
    this.buscarProductoControl.setValue(null);
    this.buscarSubfamiliaControl.setValue(null);
    this.buscarFamiliaControl.setValue(null);
    this.buscarCajeroControl.setValue(null);
    this.selectedUsuario = null;
    this.selectedSubFamilia = null;
    this.selectedFamilia = null;
    this.productoList = [];
    this.pag.limpiar();
    this.vaciarReporte();
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
      this.selectedSubFamilia?.id,
      true,
      this.selectedFamilia?.id
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
      query: this.funcionarioSearch,
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "nickname", nombre: "Nombre", width: "90%" },
      ],
      texto: this.buscarCajeroControl.value,
      search: true,
      inicialSearch: true,
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
      .subscribe((res: Funcionario) => {
        if (res != null) {
          if (res.persona?.id) {
            this.usuarioService
              .onGetUsuarioPorPersonaId(res.persona.id)
              .pipe(untilDestroyed(this))
              .subscribe((resUsuario) => {
                if (resUsuario != null) {
                  this.selectedUsuario = resUsuario;
                  this.buscarCajeroControl.setValue(res.id + " - " + res.nickname);
                } else {
                  this.notificacionService.openWarn(
                    "Nombre de usuario no encontrado"
                  );
                  this.buscadorCajeroInput.nativeElement.select();
                }
              });
          } else {
            this.notificacionService.openWarn(
              "El funcionario seleccionado no tiene una persona asociada"
            );
          }
        }
      });
  }

  onBuscarFamilia() {
    let tableData: TableData[] = [
      { id: "id", nombre: "Id" },
      { id: "nombre", nombre: "Nombre" }
    ];
    let data: SearchListtDialogData = {
      query: this.searchFamilia,
      tableData: tableData,
      titulo: "Buscar Familia",
      search: true,
      queryData: { texto: this.buscarFamiliaControl.value },
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
      .subscribe((res: Familia | any) => {
        if (res != null) {
          this.selectedFamilia = { id: parseInt(res.id, 10), nombre: res.nombre } as Familia;
          this.buscarFamiliaControl.setValue(res.nombre);
        }
      });
  }

  onClearFamilia() {
    this.selectedFamilia = null;
    this.buscarFamiliaControl.setValue(null);
  }

  onBuscarSubFamilia() {
    let tableData: TableData[] = [
      { id: "id", nombre: "Id" },
      { id: "nombre", nombre: "Nombre" },
      { id: "familia.nombre", nombre: "Familia" },
    ];

    // Si hay familia seleccionada, filtra por ella; si no, busca en todas
    const querySubfamilia = this.selectedFamilia
      ? this.searchSubfamiliaFiltered
      : this.searchSubfamilia;

    const queryData = this.selectedFamilia
      ? { texto: this.buscarSubfamiliaControl.value, familiaId: this.selectedFamilia.id }
      : { texto: this.buscarSubfamiliaControl.value };

    let data: SearchListtDialogData = {
      query: querySubfamilia,
      tableData: tableData,
      titulo: "Buscar Subfamilia",
      search: true,
      queryData: queryData,
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
          this.selectedSubFamilia = { id: parseInt(res.id, 10), nombre: res.nombre } as Subfamilia;
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