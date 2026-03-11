import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { PageInfo } from "../../../../app.component";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { MainService } from "../../../../main.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { ProveedorService } from "../../../personas/proveedor/proveedor.service";
import { Producto } from "../../../productos/producto/producto.model";
import { PedidoService } from "../pedido.service";
import { Pedido } from "../gestion-compras/pedido.model";
import { ProcesoEtapaTipo } from "../gestion-compras/proceso-etapa.model";
import { GestionComprasComponent } from "../gestion-compras/gestion-compras.component";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../../notificacion-snackbar.service";
import { PdvSearchProductoDialogComponent, PdvSearchProductoResponseData } from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { interval } from "rxjs";

@UntilDestroy()
@Component({
  selector: "app-list-compra",
  templateUrl: "./list-compra.component.html",
  styleUrls: ["./list-compra.component.scss"],
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
export class ListCompraComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  titulo = "Lista de Compras";

  dataSource = new MatTableDataSource<Pedido>([]);

  selectedPedido: Pedido;
  expandedPedido: Pedido;

  idControl = new FormControl();
  sucursalControl = new FormControl();
  productoControl = new FormControl();
  proveedorControl = new FormControl();
  estadoControl = new FormControl();
  fechaInicioControl = new FormControl();
  fechaFinControl = new FormControl();
  fechaFormGroup: FormGroup;
  
  sucursalList: Sucursal[] = [];
  selectedProveedor: Proveedor;
  selectedProducto: Producto;
  estadoList = Object.values(ProcesoEtapaTipo);
  today = new Date();

  displayedColumns = [
    "id",
    "proveedor",
    "vendedor",
    "fecha",
    "etapa",
    "acciones",
  ];

  length = 25;
  pageSize = 25;
  pageIndex = 0;
  pageEvent: PageEvent;
  selectedPageInfo: PageInfo<Pedido>;

  constructor(
    private pedidoService: PedidoService,
    private cargandoService: CargandoDialogService,
    private tabService: TabService,
    public mainService: MainService,
    private sucursalService: SucursalService,
    private proveedorService: ProveedorService,
    private matDialog: MatDialog,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1]);
      this.pageSize = this.paginator.pageSizeOptions[1];
      this.onFilter();
    }, 0);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl,
    });

    this.onGetPedidos();
    this.loadSucursales();
    this.loadProveedores();

    interval(300000).pipe(untilDestroyed(this)).subscribe(() => {
      this.onFilter();
    });
  }

  onGetPedidos() {
    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.today.getDate() - 7);
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.today);
    this.onFilter();
  }

  loadSucursales() {
    this.sucursalService.onGetAllSucursales(true).subscribe((res) => {
      this.sucursalList = res.filter((s) => s.id != 0);
    });
  }

  loadProveedores() {
    // Proveedores se cargan mediante búsqueda cuando el usuario lo necesita
  }

  onFilter() {
    if (this.fechaFinControl.value == null)
      this.fechaFinControl.setValue(this.today);
    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.fechaFinControl.value.getDate() - 7);
    if (this.fechaInicioControl.value == null)
      this.fechaInicioControl.setValue(unaSemanaAtras);
    
    if (this.idControl.value == null) {
      let fechaInicio: Date = this.fechaInicioControl.value;
      let fechaFin: Date = this.fechaFinControl.value;
      fechaInicio.setHours(0, 0, 0);
      fechaFin.setHours(23, 59, 59);
      
      this.pedidoService
        .onGetPedidosWithFilters(
          this.sucursalControl.value?.id || null,
          this.selectedProducto?.id,
          this.selectedProveedor?.id,
          this.estadoControl.value || null,
          dateToString(fechaInicio),
          dateToString(fechaFin),
          this.pageIndex,
          this.pageSize
        )
        .pipe(untilDestroyed(this))
        .subscribe((res: PageInfo<Pedido>) => {
          if (res != null) {
            this.selectedPageInfo = res;
            // Calcular etapa actual para cada pedido
            res.getContent.forEach(pedido => {
              (pedido as any).etapaActualComputed = this.computeEtapaActual(pedido);
            });
            this.dataSource.data = res.getContent;
          }
        });
    } else {
      this.pedidoService
        .onGetPedidoById(this.idControl.value)
        .subscribe((res) => {
          if (res != null) {
            (res as any).etapaActualComputed = this.computeEtapaActual(res);
            this.dataSource.data = [res];
          }
        });
    }
  }

  onResetFiltro() {
    this.idControl.setValue(null);
    this.sucursalControl.setValue(null);
    this.onClearProducto();
    this.onClearProveedor();
    this.estadoControl.setValue(null);
    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.today.getDate() - 7);
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.today);
    this.onFilter();
  }

  onRowClick(pedido: Pedido, index) {
    // Expand/collapse row functionality can be added here if needed
  }

  onView(pedido: Pedido, index) {
    this.tabService.addTab(
      new Tab(
        GestionComprasComponent,
        "Pedido " + pedido.id,
        new TabData(pedido.id),
        ListCompraComponent
      )
    );
  }

  onEdit(pedido: Pedido, index) {
    this.tabService.addTab(
      new Tab(
        GestionComprasComponent,
        "Pedido " + pedido.id,
        new TabData(pedido.id),
        ListCompraComponent
      )
    );
  }

  onImprimir(pedido: Pedido) {
    this.pedidoService.onImprimirPedido(pedido.id).subscribe({
      next: (res) => {
        // TODO: Handle print result when implemented
      },
      error: (error) => {
        this.notificacionService.notification$.next({
          texto: "Funcionalidad de impresión no disponible aún",
          color: NotificacionColor.warn,
          duracion: 3
        });
      }
    });
  }

  onCancelar(pedido: Pedido, index) {
    this.pedidoService.onCancelarPedido(pedido.id).subscribe({
      next: (res) => {
        if (res) {
          this.dataSource.data = updateDataSource(
            this.dataSource.data,
            null,
            index
          );
          this.notificacionService.notification$.next({
            texto: "Pedido cancelado correctamente",
            color: NotificacionColor.success,
            duracion: 3
          });
          this.onFilter(); // Refresh list
        }
      },
      error: (error) => {
        this.notificacionService.notification$.next({
          texto: "Error al cancelar el pedido",
          color: NotificacionColor.danger,
          duracion: 4
        });
      }
    });
  }

  onAdd() {
    this.tabService.addTab(
      new Tab(
        GestionComprasComponent,
        "Nuevo Pedido",
        null,
        ListCompraComponent
      )
    );
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFilter();
  }

  onSearchProducto() {
    if (this.selectedProducto) {
      return; // No abrir diálogo si ya hay un producto seleccionado
    }
    
    // Obtener el texto del campo si existe
    const searchText = this.productoControl.value?.trim() || "";
    
    const dialogRef = this.matDialog.open(PdvSearchProductoDialogComponent, {
      width: "80%",
      height: "80%",
      data: {
        texto: searchText,
        conservarUltimaBusqueda: true
      },
    });

    dialogRef.afterClosed().subscribe((result: PdvSearchProductoResponseData) => {
      if (result && result.producto) {
        this.selectedProducto = result.producto;
        this.productoControl.setValue(`${result.producto.id} - ${result.producto.descripcion}`);
        this.productoControl.disable();
      } else {
        // Si no se seleccionó nada, limpiar el campo
        this.productoControl.setValue(null);
      }
    });
  }

  onProductoKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !this.selectedProducto) {
      event.preventDefault();
      this.onSearchProducto();
    }
  }

  onClearProducto() {
    this.selectedProducto = null;
    this.productoControl.setValue(null);
    this.productoControl.enable();
  }

  onSearchProveedor() {
    if (this.selectedProveedor) {
      return; // No abrir diálogo si ya hay un proveedor seleccionado
    }
    
    // Obtener el texto del campo si existe
    const searchText = this.proveedorControl.value?.trim() || null;
    
    this.proveedorService.onSearchProveedorPorTexto(searchText).subscribe({
      next: (result: Proveedor) => {
        if (result) {
          this.selectedProveedor = result;
          this.proveedorControl.setValue(`${result.id} - ${result.persona?.nombre}`);
          this.proveedorControl.disable();
        } else {
          // Si no se seleccionó nada, limpiar el campo
          this.proveedorControl.setValue(null);
        }
      },
      error: (error) => {
        console.error("Error buscando proveedor:", error);
        // Limpiar el campo en caso de error
        this.proveedorControl.setValue(null);
      }
    });
  }

  onProveedorKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !this.selectedProveedor) {
      event.preventDefault();
      this.onSearchProveedor();
    }
  }

  onClearProveedor() {
    this.selectedProveedor = null;
    this.proveedorControl.setValue(null);
    this.proveedorControl.enable();
  }

  private computeEtapaActual(pedido: Pedido): string {
    if (!pedido?.procesoEtapas || pedido.procesoEtapas.length === 0) {
      return "CREACION";
    }
    
    // Buscar etapa en proceso
    const etapaEnProceso = pedido.procesoEtapas.find(
      (e) => e.estadoEtapa === "EN_PROCESO"
    );
    if (etapaEnProceso) {
      return etapaEnProceso.tipoEtapa;
    }
    
    // Buscar primera etapa pendiente
    const etapaPendiente = pedido.procesoEtapas.find(
      (e) => e.estadoEtapa === "PENDIENTE"
    );
    if (etapaPendiente) {
      return etapaPendiente.tipoEtapa;
    }
    
    return "CREACION";
  }
}
