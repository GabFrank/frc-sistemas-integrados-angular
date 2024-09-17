import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { CargandoDialogComponent } from "../../../../shared/components/cargando-dialog/cargando-dialog.component";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { PrintService } from "../../../print/print.service";
import { ReporteService } from "../../../reportes/reporte.service";
import { ReportesComponent } from "../../../reportes/reportes/reportes.component";
import { ProductoComponent } from "../edit-producto/producto.component";
import { Producto } from "../producto.model";
import { ProductoService } from "../producto.service";

interface ProductoDatasource {
  id: number;
  descripcion: string;
  precio1: number;
  precio2: number;
  precio3: number;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ROLES } from "../../../personas/roles/roles.enum";
import { MainService } from "../../../../main.service";
import { PageInfo } from "../../../../app.component";
import { CodigoService } from "../../codigo/codigo.service";
import { Subfamilia } from "../../sub-familia/sub-familia.model";
import { SubFamiliaService } from "../../sub-familia/sub-familia.service";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
  TableData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { SubfamiliasSearchGQL } from "../../sub-familia/graphql/subfamiliasSearch";
import { SearchSubfamiliaByDescripcionGQL } from "../../sub-familia/graphql/searchByDescripcion";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-producto",
  templateUrl: "./list-producto.component.html",
  styleUrls: ["./list-producto.component.css"],
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
export class ListProductoComponent implements OnInit, AfterViewInit {
  readonly ROLES = ROLES;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("filtroProductoInput") filtroProductoInput: ElementRef;

  // la fuente de datos de la tabla
  dataSource = new MatTableDataSource();

  //controladores
  filtroProductoControl = new FormControl("");
  filtroCodigoControl = new FormControl(false);
  activoControl = new FormControl(null);
  stockControl = new FormControl(null);
  balanzaControl = new FormControl(null);
  subfamiliaControl = new FormControl(null);
  vencimientoControl = new FormControl(null);

  //producto seleccionado
  selectedProducto = new Producto();
  selectedRowIndex;
  menuState: string = "out";
  isSearching = false;
  onSearchTimer;
  imagenPrincipal = null;
  displayedColumns: string[] = [
    "id",
    "descripcion",
    "codigoPrincipal",
    "costoMedio",
    "costoUltCompra",
    "precioPrincipal",
    "activo",
    "acciones",
  ];
  expandedProducto: Producto;
  pageIndex = 0;
  pageSize = 15;
  selectedPageInfo: PageInfo<Producto>;

  //subfamilia
  selectedSubfamilia: Subfamilia;

  private service: ProductoService;

  constructor(
    private injector: Injector,
    private tabService: TabService,
    private matDialog: MatDialog,
    private printService: PrintService,
    private cargandoDialog: CargandoDialogService,
    private reporteService: ReporteService,
    public mainService: MainService,
    private codigoService: CodigoService,
    private searchSubfamilia: SearchSubfamiliaByDescripcionGQL
  ) {
    setTimeout(() => (this.service = injector.get(ProductoService)));
  }

  ngOnInit(): void {
    // subscripcion a los datos de productos
    //listener para el campo buscar
    // this.buscarField.valueChanges.subscribe((res) => {
    //   this.onSearchChange(res);
    // });
    // this.buscarField.valueChanges
    //   .pipe(untilDestroyed(this))
    //   .subscribe((value) => {
    //     if (value != null) this.onSearchProducto(value);
    //   });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.filtroProductoInput.nativeElement.focus();
    }, 500);

    console.log(this.mainService.usuarioActual.roles);
  }

  createForm() {}

  onSearchProducto() {
    this.isSearching = true;
    console.log(this.selectedSubfamilia?.id);

    this.service
      .onSearchWithFilters(
        this.filtroCodigoControl.value == false
          ? this.filtroProductoControl.value
          : null,
        this.filtroCodigoControl.value == true
          ? this.filtroProductoControl.value
          : null,
        this.activoControl.value,
        this.stockControl.value,
        this.balanzaControl.value,
        this.selectedSubfamilia?.id,
        this.vencimientoControl.value,
        this.pageIndex,
        this.pageSize
      )
      .subscribe((res) => {
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent;
        this.isSearching = false;
      });
  }

  onRowClick(row) {
    this.selectedProducto = row;
    this.expandedProducto = this.selectedProducto;
  }

  onEditProducto(producto, i) {
    if (producto == null) {
      this.tabService.addTab(
        new Tab(
          ProductoComponent,
          "Nuevo Producto",
          null,
          ListProductoComponent
        )
      );
    } else {
      this.tabService.addTab(
        new Tab(
          ProductoComponent,
          producto.descripcion,
          new TabData(null, {id: producto.id}),
          ListProductoComponent
        )
      );
    }
  }

  onVerMovimiento(producto: Producto, i) {}

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onFiltrar() {
    this.onSearchProducto();
  }
  resetFiltro() {}
  onAddProducto() {
    this.onEditProducto(null, null);
  }

  toogleCheck(formControl: FormControl) {
    if (formControl.value == null) {
      formControl.setValue(true);
    } else if (formControl.value == true) {
      formControl.setValue(false);
    } else {
      formControl.setValue(null);
    }
  }

  onBuscarSubfamilia() {
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
      queryData: { texto: this.subfamiliaControl.value },
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
          this.selectedSubfamilia = res;
          this.subfamiliaControl.setValue(res.nombre);
        }
      });
  }
  onClearSubfamilia() {}
}
