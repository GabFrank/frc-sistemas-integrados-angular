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
import { PorSucursal } from "../../../../commons/core/utils/por-sucursal";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError, TIMEOUT_CONSULTA_DE_FONDO_MS } from "../../../../generics/generic-crud.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { CargandoDialogComponent } from "../../../../shared/components/cargando-dialog/cargando-dialog.component";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { PrintService } from "../../../print/print.service";
import { ReporteService } from "../../../reportes/reporte.service";
import { ReportesComponent } from "../../../reportes/reportes/reportes.component";
import { ProductoComponent } from "../edit-producto/producto.component";
import { ExistenciaCostoPorSucursal, Producto } from "../producto.model";
import { ProductoService, TIMEOUT_REPORTE_MS } from "../producto.service";
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { MovimientoStock } from '../../../operaciones/movimiento-stock/movimiento-stock.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { MovimientoStockService } from '../../../operaciones/movimiento-stock/movimiento-stock.service';
import { ThermalPrinterService } from '../../../configuracion/thermal-printer/thermal-printer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PrintLabelDialogComponent } from './print-label-dialog/print-label-dialog.component';

/**
 * Stock por sucursal de la fila desplegada: el error de red y el del servidor llegan a la pantalla, que avisa una
 * vez. Sin esto un error del servidor llegaba como «sin movimientos» y se pintaba stock 0 en todas las sucursales (#390).
 */
const LECTURA_STOCK: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const CONSULTA_DE_FONDO: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };

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
import { AjustarStockLoteDialogComponent } from "../ajustar-stock-lote-dialog/ajustar-stock-lote-dialog.component";
import { ComponentType } from "@angular/cdk/portal";
import { AjustarCostoDialogComponent, AjustarCostoDialogData } from "../ajustar-costo-dialog/ajustar-costo-dialog.component";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { GestionProveedoresProductoDialogComponent } from "../gestion-proveedores-producto-dialog/gestion-proveedores-producto-dialog.component";
import { LotesProductoDialogComponent } from "../lotes-producto-dialog/lotes-producto-dialog.component";
import { Familia } from "../../familia/familia.model";
import { FamiliasSearchGQL } from "../../familia/graphql/familiasSearch";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

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
  familiaControl = new FormControl(null);
  vencimientoControl = new FormControl(null);
  costoCeroControl = new FormControl(null);
  stockFiltroControl = new FormControl("todos");
  sucursalFiltroControl = new FormControl(null);

  //producto seleccionado
  selectedProducto = new Producto();
  selectedRowIndex;
  menuState: string = "out";
  isSearching = false;
  // secuencia para descartar respuestas viejas que llegan despues de una busqueda
  // mas nueva y pisarian la grilla con resultados de un texto ya reemplazado
  private busquedaSeq = 0;
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
  selectedFamilia: Familia;

  private service: ProductoService;

  sucursales: Sucursal[] = [];
  /** Las sucursales no cargaron: no hay stock que mostrar ni sucursal que preseleccionar (#390). */
  sucursalesFallo = false;
  /**
   * Stock de la fila desplegada. `error` = no se pudo leer: la columna muestra «—» (ni 0 ni el spinner de
   * `cargando`). El estado vive acá y no en el modelo del producto, que comparten otras pantallas.
   */
  stockEstado: 'cargando' | 'ok' | 'error' = 'cargando';
  /** Solo aplica la última lectura de stock (otra fila, reintentos). */
  private lecturaStock = 0;
  loadingStock: { [key: number]: boolean } = {};
  stockPorSucursal: { [key: string]: number } = {};
  isSucursalSelectEnabled: boolean = false;

  stockOptions = [
    { value: 'todos', label: 'TODOS' },
    { value: 'positivo', label: 'POSITIVO' },
    { value: 'negativo', label: 'NEGATIVO' }
  ];

  isAdicionarEnabled: boolean = false;
  isGenerarPdfDisabled: boolean = true;
  puedeVerStockCompras: boolean = false;
  puedeVerCostos: boolean = false;

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
    private searchSubfamiliaFiltered: SubfamiliasSearchGQL,
    private searchFamilia: FamiliasSearchGQL,
    private sucursalService: SucursalService,
    private movimientoStockService: MovimientoStockService,
    private thermalPrinterService: ThermalPrinterService,
    private snackBar: MatSnackBar,
    private notificacionService: NotificacionSnackbarService
  ) {
    setTimeout(() => (this.service = injector.get(ProductoService)));
  }

  ngOnInit(): void {
    this.service = this.injector.get(ProductoService);
    this.cargarSucursales();
    this.updateSucursalSelectEnabled();
    this.updatePermisos();
    
    this.stockFiltroControl.valueChanges.subscribe(() => {
      this.updateSucursalSelectEnabled();
    });

    this.filtroProductoControl.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe(() => this.onFiltrar(false, true));
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.filtroProductoInput.nativeElement.focus();
    }, 500);

    //log usuario roles
    console.log(this.mainService.usuarioActual?.roles);
  }

  createForm() {}

  /** Evita un aviso por tecla: el campo de texto dispara una búsqueda en cada pausa. */
  private ultimoAvisoDeBusqueda = 0;
  /** Página que está a la vista (la última que respondió bien): a esa se vuelve si falla un cambio de página. */
  private paginaMostrada = { pageIndex: 0, pageSize: 15 };

  /** `paginaAnterior`: la búsqueda es un cambio de página; si falla se vuelve a esa página en vez de vaciar. */
  onSearchProducto(mostrarAvisoSinResultados = false, silentLoad = false,
                   paginaAnterior?: { pageIndex: number; pageSize: number }) {
    this.isSearching = true;
    this.expandedProducto = null;
    this.selectedProducto = new Producto();
    const seq = ++this.busquedaSeq;
    const fallo = () => {
      if (seq !== this.busquedaSeq) return;
      this.isSearching = false;
      if (paginaAnterior != null) {
        // Cambio de página: la que estaba a la vista sigue siendo buena
        this.pageIndex = paginaAnterior.pageIndex;
        this.pageSize = paginaAnterior.pageSize;
        if (this.paginator) {
          this.paginator.pageIndex = paginaAnterior.pageIndex;
          this.paginator.pageSize = paginaAnterior.pageSize;
        }
      } else {
        // Búsqueda o filtro nuevo: los resultados anteriores ya no corresponden a los filtros a la vista
        this.selectedPageInfo = null;
        this.dataSource.data = [];
        this.isGenerarPdfDisabled = true;
      }
      if (paginaAnterior != null) {
        this.notificacionService.openWarn('No se pudo cambiar de página: volvé a intentar.', 5);
        return;
      }
      const ahora = Date.now();
      if (ahora - this.ultimoAvisoDeBusqueda > 5000) {
        this.ultimoAvisoDeBusqueda = ahora;
        this.notificacionService.openWarn('No se pudieron buscar los productos: volvé a intentar.', 5);
      }
    };

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
        this.selectedFamilia?.id,
        this.selectedSubfamilia?.id,
        this.vencimientoControl.value,
        this.costoCeroControl.value,
        this.stockFiltroControl.value,
        this.sucursalFiltroControl.value,
        this.pageIndex,
        this.pageSize,
        true,
        silentLoad
      )
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => fallo(), next: (res) => {
        // llego tarde: ya hay una busqueda mas nueva en curso o resuelta
        if (seq !== this.busquedaSeq) return;
        if (res == null) {
          fallo();
          return;
        }

        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent;
        this.paginaMostrada = { pageIndex: this.pageIndex, pageSize: this.pageSize };
        this.isSearching = false;
        this.isGenerarPdfDisabled = !res.getContent || res.getContent.length === 0;

        if (
          mostrarAvisoSinResultados &&
          res.getContent &&
          res.getContent.length === 0
        ) {
          this.notificacionService.openWarn('Producto no encontrado');
        }
      } });
  }

  onRowClick(row, isCurrentlyExpanded: boolean) {
    if (!isCurrentlyExpanded) {
      this.selectedProducto = row;

      // Siempre un arreglo: con las sucursales sin cargar (o la del filtro sin encontrar) queda vacío
      let sucursalesDeLaFila: Sucursal[] = this.sucursales ?? [];
      if (this.sucursalFiltroControl.value) {
        // Hay sucursal seleccionada (ya sea con filtro positivo, negativo o todos)
        sucursalesDeLaFila = sucursalesDeLaFila.filter(s => s.id === this.sucursalFiltroControl.value);
      }
      this.selectedProducto.sucursales = sucursalesDeLaFila.map((s) => {
        const existencia = new ExistenciaCostoPorSucursal();
        existencia.sucursal = s;
        existencia.existencia = null;
        return existencia;
      });

      this.cargarStockDeLaFila(this.selectedProducto);
    }
  }

  /**
   * Un request por producto y no uno por sucursal: al expandir una fila sin filtro de sucursal
   * esto eran 31 consultas para llenar la misma tabla. Las sucursales sin movimientos no
   * vuelven en la respuesta —no hay filas que sumar— y se muestran en cero. Eso vale solo para una
   * respuesta buena: si la consulta falla, la fila queda en «—» con «Reintentar».
   */
  private cargarStockDeLaFila(producto: Producto): void {
    const sucursalesDeLaFila = producto?.sucursales;
    const lectura = ++this.lecturaStock;
    this.stockEstado = 'cargando';
    if (producto?.id == null || !sucursalesDeLaFila?.length) return; // sin sucursales no hay nada que pedir
    sucursalesDeLaFila.forEach((existenciaSucursal) => existenciaSucursal.existencia = null);
    this.service
      .onGetStockPorSucursales(producto.id, true, true, LECTURA_STOCK, CONSULTA_DE_FONDO)
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => {
        if (lectura !== this.lecturaStock) return; // ya se desplegó otra fila
        this.stockEstado = 'error';
        // Sin aviso si la fila ya se cerró (o se buscó otra cosa): al volver a desplegarla se pide de nuevo
        if (this.expandedProducto === producto) {
          this.notificacionService.openWarn('No se pudo leer el stock del producto: usá «Reintentar».', 5);
        }
      }, next: (stockPorSucursal: PorSucursal<number>) => {
        sucursalesDeLaFila.forEach((existenciaSucursal) => {
          existenciaSucursal.existencia =
            stockPorSucursal.get(existenciaSucursal.sucursal.id) ?? 0;
        });
        if (lectura === this.lecturaStock) this.stockEstado = 'ok';
      } });
  }

  reintentarStock(): void {
    if (this.expandedProducto != null) this.cargarStockDeLaFila(this.expandedProducto);
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
        width: '800px',
        data: { producto: producto }
      });
    } else {
      this.snackBar.open('El producto no tiene precio definido', 'Cerrar', { duration: 3000 });
    }
  }

  onVerMovimiento(producto: Producto, i) {}

  handlePageEvent(e: PageEvent) {
    // La que está a la vista, no `this.pageIndex`: otro cambio de página pendiente ya lo pudo mover
    const paginaAnterior = { ...this.paginaMostrada };
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onSearchProducto(false, true, paginaAnterior);
  }

  onFiltrar(mostrarAvisoSinResultados = true, silentLoad = false) {
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.onSearchProducto(mostrarAvisoSinResultados, silentLoad);
  }

  resetFiltro() {
    this.filtroProductoControl.setValue('');
    this.filtroCodigoControl.setValue(false);
    this.activoControl.setValue(null);
    this.stockControl.setValue(null);
    this.balanzaControl.setValue(null);
    this.subfamiliaControl.setValue(null);
    this.selectedSubfamilia = null;
    this.familiaControl.setValue(null);
    this.selectedFamilia = null;
    this.vencimientoControl.setValue(null);
    this.costoCeroControl.setValue(null);
    this.stockFiltroControl.setValue('todos');
    this.sucursalFiltroControl.setValue(null);
    this.isGenerarPdfDisabled = true;
    this.onFiltrar();
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

   onBuscarFamilia() {
    let tableData: TableData[] = [
      {
        id: "id",
        nombre: "Id",
      },
      {
        id: "nombre",
        nombre: "Nombre",
      }
    ];
    let data: SearchListtDialogData = {
      query: this.searchFamilia,
      tableData: tableData,
      titulo: "Buscar Familia",
      search: true,
      queryData: { texto: this.familiaControl.value },
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
          this.familiaControl.setValue(res.nombre);
          this.onFiltrar();
        }
      });
  }

  onBuscarSubfamilia() {
    let tableData: TableData[] = [
      {
        id: "id",
        nombre: "Id",
      },
      {
        id: "nombre",
        nombre: "Nombre",
      },
      {
        id: "familia.nombre",
        nombre: "Familia",
      },
    ];

    // Si hay familia seleccionada, filtra por ella; si no, busca en todas
    const querySubfamilia = this.selectedFamilia
      ? this.searchSubfamiliaFiltered
      : this.searchSubfamilia;

    const queryData = this.selectedFamilia
      ? { texto: this.subfamiliaControl.value, familiaId: this.selectedFamilia.id }
      : { texto: this.subfamiliaControl.value };

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
          this.selectedSubfamilia = { id: parseInt(res.id, 10), nombre: res.nombre } as Subfamilia;
          this.subfamiliaControl.setValue(res.nombre);
          this.onFiltrar();
        }
      });
  }

  onClearSubfamilia() {
    this.subfamiliaControl.setValue(null);
    this.selectedSubfamilia = null;
    this.onFiltrar();
  }

  onClearFamilia() {
    this.familiaControl.setValue(null);
    this.selectedFamilia = null;
    this.onFiltrar();
  }

  cargarSucursales() {
    this.sucursalesFallo = false;
    this.sucursalService.onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED, CONSULTA_DE_FONDO)
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => {
        this.sucursalesFallo = true;
        this.notificacionService.openWarn('No se pudieron cargar las sucursales: usá «Reintentar».', 5);
      }, next: res => {
        if (res == null) {
          this.sucursalesFallo = true; // error del servidor: ya se avisó
          return;
        }
        this.sucursales = res.filter(sucursal => {
          if (sucursal.nombre === 'SERVIDOR') return false;
          if (sucursal.nombre === 'COMPRAS' && !this.puedeVerStockCompras) return false;
          return true;
        });
        // La fila que estaba desplegada sin sucursales se cierra: al abrirla de nuevo ya las tiene
        if (this.expandedProducto != null && !this.expandedProducto.sucursales?.length) this.expandedProducto = null;
      } });
  }

  onStockFiltroChange() {
    this.updateSucursalSelectEnabled();
  }

  updateSucursalSelectEnabled() {
    this.isSucursalSelectEnabled = 
    this.stockFiltroControl.value === 'positivo' || this.stockFiltroControl.value === 'negativo';
  }

  updatePermisos() {
    this.isAdicionarEnabled = this.mainService.usuarioActual?.roles?.includes(ROLES.EDITAR_PRODUCTOS) || false;
    this.puedeVerStockCompras =
      this.mainService.usuarioActual?.roles?.includes(ROLES.ADMIN) ||
      this.mainService.usuarioActual?.roles?.includes(ROLES.VER_STOCK_COMPRAS) ||
      false;
    this.puedeVerCostos =
      this.mainService.usuarioActual?.roles?.includes(ROLES.EDITAR_PRODUCTOS) ||
      this.mainService.usuarioActual?.roles?.includes(ROLES.ADMIN) ||
      false;
  }

  /**
   * Los productos con control de lote van por otro diálogo: ajustar solo la existencia agregada
   * dejaría el ledger por lote sin tocar, y esa mercadería no la podría volver a asignar FEFO. Los
   * demás siguen por el camino de siempre, sin ningún cambio.
   */
  onAjustarStock(producto: Producto) {
    if (this.sucursalesFallo && this.sucursalFiltroControl.value) {
      // Con filtro de sucursal el diálogo abre fijo en esa sucursal: sin la lista no hay cuál pasarle
      this.notificacionService.openWarn('No se pudieron cargar las sucursales: usá «Reintentar» antes de ajustar el stock.', 5);
      return;
    }
    const sucursalPreseleccionada = this.getSucursalPreseleccionada();
    const permitirCambiarSucursal = this.stockFiltroControl.value === 'todos';

    const dialogData: AjustarStockDialogData = {
      producto: producto,
      sucursalPreseleccionada: sucursalPreseleccionada,
      permitirCambiarSucursal: permitirCambiarSucursal
    };

    const componente: ComponentType<any> = producto?.lote === true
      ? AjustarStockLoteDialogComponent
      : AjustarStockDialogComponent;

    const dialogRef = this.matDialog.open(componente, {
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
    if (this.sucursalFiltroControl.value) {
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

  onGestionarProveedoresProducto(producto: Producto): void {
    this.matDialog.open(GestionProveedoresProductoDialogComponent, {
      data: { producto },
      width: '50vw',
      height: '50vh',
      maxWidth: '50vw',
      maxHeight: '50vh',
      panelClass: 'gestion-proveedores-producto-dialog-panel',
    }).afterClosed().subscribe(() => {
      this.expandedProducto = null;
    });
  }

  /**
   * Abre el maestro de lotes del producto. Desde ahí se puede bloquear un lote (recall):
   * deja de venderse en todas las sucursales sin modificar el stock físico.
   */
  onVerLotes(producto: Producto): void {
    this.matDialog.open(LotesProductoDialogComponent, {
      data: { producto },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh'
    }).afterClosed().subscribe(() => {
      this.expandedProducto = null;
    });
  }

  onGenerarReporte() {
    if (!this.validarCondicionesParaReporte()) {
      return;
    }

    const parametrosReporte = this.construirParametrosReporte();
    this.ejecutarGeneracionReporte(parametrosReporte);
  }

  validarCondicionesParaReporte(): boolean {
    if (!this.dataSource.data || this.dataSource.data.length === 0) {
      this.notificacionService.openWarn('No hay productos para generar el reporte');
      return false;
    }

    if (!this.mainService.usuarioActual) {
      this.notificacionService.openWarn('Error: usuario no identificado');
      return false;
    }

    return true;
  }

  construirParametrosReporte(): any {
    return {
      texto: this.filtroProductoControl.value || '',
      codigo: this.filtroCodigoControl.value || false,
      activo: this.activoControl.value,
      stock: this.stockControl.value,
      balanza: this.balanzaControl.value,
      vencimiento: this.vencimientoControl.value,
      costoCero: this.costoCeroControl.value,
      subfamiliaId: this.selectedSubfamilia?.id || null,
      familiaId: this.selectedFamilia?.id || null,
      stockFiltro: this.stockFiltroControl.value !== 'todos' ? this.stockFiltroControl.value : null,
      sucursalId: this.sucursalFiltroControl.value ? this.sucursalFiltroControl.value : null,
      usuarioId: this.mainService.usuarioActual.id,
      usuario: this.mainService.usuarioActual.nickname || this.mainService.usuarioActual.persona?.nombre || 'Usuario'
    };
  }


  ejecutarGeneracionReporte(parametrosReporte: any) {
    // El modal dura lo que puede durar la consulta (sin esto se cierra solo a los 65 s y deja pedir otro reporte)
    const loadingRef = this.cargandoDialog.openDialog(false, 'Generando reporte de productos...', TIMEOUT_REPORTE_MS + 5000);

    this.service.onExportarReporteConFiltros(parametrosReporte).subscribe({
      next: (response) => {
        this.cargandoDialog.closeDialog(loadingRef.requestId);
        if (response) {
          this.reporteService.onAdd(`Reporte de productos ${new Date().toLocaleString()}`, response);
          this.tabService.addTab(
            new Tab(ReportesComponent, "Reportes", null, ListProductoComponent)
          );
          this.notificacionService.openSucess('Reporte generado exitosamente');
        } else {
          this.notificacionService.openAlgoSalioMal('Error al generar el reporte');
        }
      },
      error: (error) => {
        this.cargandoDialog.closeDialog(loadingRef.requestId);
        console.error('Error al generar reporte:', error);
        this.notificacionService.openAlgoSalioMal('Error al generar el reporte');
      }
    });
  }
}
