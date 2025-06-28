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
import { ExistenciaCostoPorSucursal, Producto } from "../producto.model";
import { ProductoService } from "../producto.service";
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { MovimientoStock } from '../../../operaciones/movimiento-stock/movimiento-stock.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { MovimientoStockService } from '../../../operaciones/movimiento-stock/movimiento-stock.service';
import { ThermalPrinterService } from '../../../configuracion/thermal-printer/thermal-printer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PrintLabelDialogComponent } from './print-label-dialog/print-label-dialog.component';

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
import { AjustarStockDialogComponent, AjustarStockDialogData } from "../ajustar-stock-dialog/ajustar-stock-dialog.component";
import { AjustarCostoDialogComponent, AjustarCostoDialogData } from "../ajustar-costo-dialog/ajustar-costo-dialog.component";

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
  titulo = 'Lista de productos';
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
  costoCeroControl = new FormControl(null);
  stockFiltroControl = new FormControl("todos");
  sucursalFiltroControl = new FormControl(null);

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

  sucursales: Sucursal[] = [];
  loadingStock: { [key: number]: boolean } = {};
  stockPorSucursal: { [key: string]: number } = {};
  isSucursalSelectEnabled: boolean = false;

  stockOptions = [
    { value: 'todos', label: 'TODOS' },
    { value: 'positivo', label: 'POSITIVO' },
    { value: 'negativo', label: 'NEGATIVO' }
  ];

  constructor(
    private injector: Injector,
    private tabService: TabService,
    private matDialog: MatDialog,
    private printService: PrintService,
    private cargandoDialog: CargandoDialogService,
    private reporteService: ReporteService,
    public mainService: MainService,
    private codigoService: CodigoService,
    private searchSubfamilia: SearchSubfamiliaByDescripcionGQL,
    private sucursalService: SucursalService,
    private movimientoStockService: MovimientoStockService,
    private thermalPrinterService: ThermalPrinterService,
    private snackBar: MatSnackBar,
  ) {
    setTimeout(() => (this.service = injector.get(ProductoService)));
  }

  ngOnInit(): void {
    this.service = this.injector.get(ProductoService);
    this.cargarSucursales();
    this.updateSucursalSelectEnabled();
    
    this.stockFiltroControl.valueChanges.subscribe(() => {
      this.updateSucursalSelectEnabled();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.filtroProductoInput.nativeElement.focus();
    }, 500);

    //log usuario roles
    console.log(this.mainService.usuarioActual?.roles);
  }

  createForm() {}

  onSearchProducto() {
    this.isSearching = true;
    this.expandedProducto = null;
    this.selectedProducto = new Producto();

    this.service
      .onSearchWithFilters(
        this.filtroCodigoControl.value == true
          ? null
          : this.filtroProductoControl.value,
        this.filtroCodigoControl.value == true
          ? this.filtroProductoControl.value
          : null,
        this.activoControl.value,
        this.stockControl.value,
        this.balanzaControl.value,
        this.selectedSubfamilia?.id,
        this.vencimientoControl.value,
        this.costoCeroControl.value,
        this.stockFiltroControl.value,
        this.sucursalFiltroControl.value,
        this.pageIndex,
        this.pageSize,
        true
      )
      .subscribe((res) => {
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent;
        this.isSearching = false;
      });
  }

  onRowClick(row, isCurrentlyExpanded: boolean) {
    if (!isCurrentlyExpanded) {
      this.selectedProducto = row;

      if (this.sucursalFiltroControl.value && this.isSucursalSelectEnabled) {
        const sucursalSeleccionada = this.sucursales.find(s => s.id === this.sucursalFiltroControl.value);
        if (sucursalSeleccionada) {
          const existencia = new ExistenciaCostoPorSucursal();
          existencia.sucursal = sucursalSeleccionada;
          existencia.existencia = null;
          this.selectedProducto.sucursales = [existencia];
        }
      } else {
      this.selectedProducto.sucursales = this.sucursales.map((s) => {
        const existencia = new ExistenciaCostoPorSucursal();
        existencia.sucursal = s;
        existencia.existencia = null;
        return existencia;
      });
      }

      this.selectedProducto.sucursales.forEach((existenciaSucursal) => {
        this.service
          .onGetStockPorProductoAndSucursal(
            this.selectedProducto.id,
            existenciaSucursal.sucursal.id,
            true
          )
          .subscribe((stock) => {
            existenciaSucursal.existencia = stock;
          });
      });
    }
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

  /**
   * Opens a dialog to print a price label for the selected product
   * @param producto The product to print a label for
   */
  onPrintPriceLabel(producto: Producto) {
    if (producto && producto.precioPrincipal) {
      this.matDialog.open(PrintLabelDialogComponent, {
        width: '400px',
        data: { producto: producto }
      });
    } else {
      this.snackBar.open('El producto no tiene precio definido', 'Cerrar', { duration: 3000 });
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

  resetFiltro() {
    this.filtroProductoControl.setValue('');
    this.filtroCodigoControl.setValue(false);
    this.activoControl.setValue(null);
    this.stockControl.setValue(null);
    this.balanzaControl.setValue(null);
    this.subfamiliaControl.setValue(null);
    this.selectedSubfamilia = null;
    this.vencimientoControl.setValue(null);
    this.costoCeroControl.setValue(null);
    this.stockFiltroControl.setValue('todos');
    this.sucursalFiltroControl.setValue(null);
  }

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

  onClearSubfamilia() {
    this.subfamiliaControl.setValue(null);
    this.selectedSubfamilia = null;
  }

  cargarSucursales() {
    this.sucursalService.onGetAllSucursales(true, true).subscribe(res => {
      this.sucursales = res?.filter(sucursal => 
        sucursal.nombre != "SERVIDOR" && sucursal.nombre != "COMPRAS");
    })
  }

  onStockFiltroChange() {
    if (this.stockFiltroControl.value === 'todos') {
      this.sucursalFiltroControl.setValue(null);
    }
    this.updateSucursalSelectEnabled();
  }

  updateSucursalSelectEnabled() {
    this.isSucursalSelectEnabled = 
    this.stockFiltroControl.value === 'positivo' || this.stockFiltroControl.value === 'negativo';
  }

  onAjustarStock(producto: Producto) {
    const sucursalPreseleccionada = this.getSucursalPreseleccionada();
    const permitirCambiarSucursal = this.stockFiltroControl.value === 'todos';

    const dialogData: AjustarStockDialogData = {
      producto: producto,
      sucursalPreseleccionada: sucursalPreseleccionada,
      permitirCambiarSucursal: permitirCambiarSucursal
    };

    const dialogRef = this.matDialog.open(AjustarStockDialogComponent, {
      data: dialogData,
      width: '600px',
      maxHeight: '90vh',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expandedProducto = null;
        this.onFiltrar();
      }
    });
  }

  getSucursalPreseleccionada(): Sucursal | undefined {
    if ((this.stockFiltroControl.value === 'positivo' || this.stockFiltroControl.value === 'negativo') 
        && this.sucursalFiltroControl.value) {
      return this.sucursales.find(s => s.id === this.sucursalFiltroControl.value);
    }
    return undefined;
  }

  onAjustarCosto(producto: Producto) {
    const dialogData: AjustarCostoDialogData = {
      producto: producto
    };

    const dialogRef = this.matDialog.open(AjustarCostoDialogComponent, {
      data: dialogData,
      width: '600px', 
      maxHeight: '90vh',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expandedProducto = null;
        this.onFiltrar();
      }
    });
  }
}
