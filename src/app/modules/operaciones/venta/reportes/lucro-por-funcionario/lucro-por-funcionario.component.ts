import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { LucroPorFuncionario } from "./lucro-por-funcionario.model";
import { FormControl, FormGroup } from "@angular/forms";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Observable, forkJoin, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { Sucursal } from "../../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../../empresarial/sucursal/sucursal.service";
import {
  combineDateTime,
  dateToString,
} from "../../../../../commons/core/utils/dateUtils";
import { VentaService } from "../../venta.service";
import { MatDialog } from "@angular/material/dialog";
import { Producto } from "../../../../productos/producto/producto.model";
import { ProductoService } from "../../../../productos/producto/producto.service";
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
import { UsuarioService } from "../../../../personas/usuarios/usuario.service";
import { Subfamilia } from "../../../../productos/sub-familia/sub-familia.model";
import { SubfamiliasSearchGQL } from "../../../../productos/sub-familia/graphql/subfamiliasSearch";
import { SearchSubfamiliaByDescripcionGQL } from "../../../../productos/sub-familia/graphql/searchByDescripcion";
import { FuncionariosWithPageGQL } from "../../../../personas/funcionarios/graphql/funcionarios-with-page";
import { Funcionario } from "../../../../personas/funcionarios/funcionario.model";
import { Familia } from "../../../../productos/familia/familia.model";
import { FamiliasSearchGQL } from "../../../../productos/familia/graphql/familiasSearch";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-lucro-por-funcionario",
  templateUrl: "./lucro-por-funcionario.component.html",
  styleUrls: ["./lucro-por-funcionario.component.scss"],
})
export class LucroPorFuncionarioComponent implements OnInit {
  @ViewChild("buscadorInput", { static: true }) buscadorInput: ElementRef;
  @ViewChild("funcionarioInput", { static: true })
  buscadorFuncionarioInput: ElementRef;

  dataSource = new MatTableDataSource<LucroPorFuncionario>([]);
  isLastPage = true;
  sucursalControl = new FormControl();
  fechaFormGroup: FormGroup;
  today = new Date();
  fechaInicioControl = new FormControl();
  fechaFinalControl = new FormControl();
  horaInicioControl = new FormControl("00:00");
  horaFinalControl = new FormControl("23:59");
  sucursalList: Sucursal[];
  sucursalIdList: number[];
  previousSelectedSucursales: any[] = [];
  buscarProductoControl = new FormControl();
  buscarSubfamiliaControl = new FormControl();
  selectedProducto: Producto;
  productoList: Producto[] = [];
  buscarFuncionarioControl = new FormControl();
  funcionarioList: Funcionario[] = [];
  selectedSubFamilia: Subfamilia;
  selectedFamilia: Familia;
  buscarFamiliaControl = new FormControl();

  displayedColumns: string[] = [
    "id",
    "nombreFuncionario",
    "cantidad",
    "costoUnitario",
    "ventaMedia",
    "costoTotal",
    "totalVenta",
    "totalDescuento",
    "totalAumento",
    "lucro",
    "margenCosto",
    "margenVenta",
  ];

  totalVenta = 0;
  totalCosto = 0;
  totalLucro = 0;
  totalDescuento = 0;
  totalAumento = 0;
  margenPromedio = 0;
  margenCostoPromedio = 0;

  page = 0;
  size = 20;
  totalElements = 0;

  constructor(
    private sucursalService: SucursalService,
    private ventaService: VentaService,
    private productoService: ProductoService,
    private dialog: MatDialog,
    private notificacionService: NotificacionSnackbarService,
    private funcionariosWithPage: FuncionariosWithPageGQL,
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

      this.resolveUsuarioIdList()
        .pipe(
          switchMap((usuarioIdList) => {
            return this.ventaService.onGetLucroPorFuncionario(
              fechaInicio,
              fechaFin,
              this.toSucursalesId(this.sucursalControl.value),
              usuarioIdList,
              productoIdList,
              this.selectedSubFamilia?.id,
              this.page,
              this.size,
              this.selectedFamilia?.id
            );
          }),
          untilDestroyed(this)
        )
        .subscribe((res) => {
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

  private resolveUsuarioIdList(): Observable<number[]> {
    if (this.funcionarioList.length === 0) {
      return of([]);
    }

    return forkJoin(
      this.funcionarioList.map((funcionario) =>
        this.resolveUsuarioIdFromFuncionario(funcionario)
      )
    ).pipe(
      map((usuarioIds) => {
        const validIds = usuarioIds.filter((id) => id != null) as number[];
        if (validIds.length < this.funcionarioList.length) {
          this.notificacionService.openWarn(
            "Algunos funcionarios seleccionados no tienen un usuario asociado"
          );
        }
        return validIds;
      })
    );
  }

  private resolveUsuarioIdFromFuncionario(
    funcionario: Funcionario
  ): Observable<number | null> {
    if (funcionario?.persona?.id) {
      return this.usuarioService
        .onGetUsuarioPorPersonaId(funcionario.persona.id)
        .pipe(
          map((usuario) => {
            if (usuario?.id) {
              return usuario.id;
            }
            return funcionario?.usuario?.id ?? null;
          })
        );
    }
    return of(funcionario?.usuario?.id ?? null);
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
    this.margenCostoPromedio =
      this.totalCosto > 0 ? (this.totalLucro / this.totalCosto) * 100 : 0;
  }

  cargarMasDatos() {}

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
    this.buscarFuncionarioControl.setValue(null);
    this.funcionarioList = [];
    this.selectedSubFamilia = null;
    this.selectedFamilia = null;
    this.productoList = [];
    this.dataSource.data = [];
    this.totalElements = 0;

    this.totalVenta = 0;
    this.totalCosto = 0;
    this.totalLucro = 0;
    this.totalDescuento = 0;
    this.totalAumento = 0;
    this.margenPromedio = 0;
    this.margenCostoPromedio = 0;
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
    this.resolveUsuarioIdList()
      .pipe(untilDestroyed(this))
      .subscribe((usuarioIdList) => {
        this.ventaService.onImprimirReporteLucroPorFuncionario(
          fechaInicio,
          fechaFin,
          this.toSucursalesId(this.sucursalControl.value),
          usuarioIdList,
          productoIdList,
          this.selectedSubFamilia?.id,
          true,
          this.selectedFamilia?.id
        );
      });
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
    let codigo;
    if (text?.length == 13 && text.substring(0, 2) == "20") {
      codigo = text.substring(2, 7);
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

  onBuscarFuncionario() {
    let data: SearchListtDialogData = {
      titulo: "Buscar Funcionario",
      query: this.funcionariosWithPage,
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "persona.nombre", nombre: "Nombre", width: "45%" },
        { id: "nickname", nombre: "Nickname", width: "45%" },
      ],
      texto: this.buscarFuncionarioControl.value,
      search: true,
      searchFieldName: "nombre",
      queryData: { nombre: this.buscarFuncionarioControl.value },
      inicialSearch: true,
      paginator: true,
      multiple: true,
      seleccionadosIniciales: [...this.funcionarioList],
    };
    this.dialog
      .open(SearchListDialogComponent, {
        data,
        width: "50%",
        height: "80%",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: Funcionario[] | Funcionario) => {
        if (Array.isArray(res)) {
          this.aplicarFuncionariosFiltro(res);
        } else if (res != null) {
          this.aplicarFuncionariosFiltro([res]);
        }
      });
  }

  aplicarFuncionariosFiltro(funcionarios: Funcionario[]) {
    this.funcionarioList = funcionarios || [];
    this.buscarFuncionarioControl.setValue(null);
  }

  getFuncionarioDisplayName(funcionario: Funcionario): string {
    return funcionario?.persona?.nombre || funcionario?.nickname || "";
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

  onClearFuncionario(index?: number) {
    if (index != null) {
      this.funcionarioList.splice(index, 1);
      return;
    }
    this.funcionarioList = [];
    this.buscarFuncionarioControl.setValue(null);
    this.buscadorFuncionarioInput.nativeElement.focus();
  }
}
