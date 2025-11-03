import { Component, OnInit, ViewChild } from "@angular/core";
import { Tab } from "../../../layouts/tab/tab.model";
import { TabService } from "../../../layouts/tab/tab.service";
import { WindowInfoService } from "../../../shared/services/window-info.service";
import { ListMaletinComponent } from "../maletin/list-maletin/list-maletin.component";
import { MaletinComponent } from "../maletin/maletin.component";
import { ListFacturaLegalComponent } from "../factura-legal/list-factura-legal/list-factura-legal.component";
import { MatDialog } from "@angular/material/dialog";
import { MainService } from "../../../main.service";
import { ROLES } from "../../personas/roles/roles.enum";
import { NotificacionSnackbarService } from "../../../notificacion-snackbar.service";
import { ListRetiroComponent } from "../retiro/list-retiro/list-retiro.component";
import { ListGastosComponent } from "../gastos/list-gastos/list-gastos.component";
import { PagoDetalleCuota, PagoDetalleCuotaEstado } from "../../operaciones/pago/pago-detalle-cuota/pago-detalle-cuota.model";
import { PagoDetalleCuotaService } from "../../operaciones/pago/pago-detalle-cuota/pago-detalle-cuota.service";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MonedaService } from "../moneda/moneda.service";
import { Moneda } from "../moneda/moneda.model";
import { CambioService } from "../cambio/cambio.service";
import { ListSolicitudPagoComponent } from "../../operaciones/solicitud-pago/list-solicitud-pago/list-solicitud-pago.component";
import { CambioComponent } from "../cambio/cambio.component";
import { FormControl } from "@angular/forms";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { CrearCambioDialogComponent } from "../cambio/crear-cambio-dialog/crear-cambio-dialog.component";
import { SucursalService } from "../../empresarial/sucursal/sucursal.service";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { PageInfo } from "../../../app.component";
import { ModificarSucursalPagoDetalleComponent } from "../../operaciones/pago/pago-detalle-cuota/modificar-sucursal-pago-detalle/modificar-sucursal-pago-detalle.component";
import { PagoDetalleService } from "../../operaciones/pago/pago-detalle/pago-detalle.service";
import { PagoDetalle, PagoDetalleInput } from "../../operaciones/pago/pago-detalle/pago-detalle.model";
import { PdvCaja } from "../../financiero/pdv/caja/caja.model";
import { forkJoin } from "rxjs";
import { FinancieroConfiguracionDialogComponent, FinancieroConfiguracionData } from '../financiero-configuracion-dialog/financiero-configuracion-dialog.component';

@UntilDestroy()
@Component({
  selector: "app-financiero-dashboard",
  templateUrl: "./financiero-dashboard.component.html",
  styleUrls: ["./financiero-dashboard.component.scss"],
})
export class FinancieroDashboardComponent implements OnInit {
  // PagoDetalleCuota vars
  cuotasPendientesDataSource = new MatTableDataSource<PagoDetalleCuota>([]);
  cuotasDisplayedColumns = ["proveedor", "sucursal", "estado", "fechaVencimiento", "totalFinal", "totalPagado", "creadoEn", "menu"];
  filtroEstado = new FormControl('TODOS');
  filtroSucursal = new FormControl(null);
  filtroFechaDesde = new FormControl(null);
  filtroFechaHasta = new FormControl(null);
  filtrarPorCreacion = new FormControl(false);
  
  estados = [
    { value: 'TODOS', label: 'TODOS' },
    { value: PagoDetalleCuotaEstado.PENDIENTE, label: 'PENDIENTE' },
    { value: PagoDetalleCuotaEstado.PAGO_PARCIAL, label: 'PAGO PARCIAL' }
  ];
  
  sucursales: Sucursal[] = [];
  
  // Pagination vars
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  
  // Moneda vars
  monedasDataSource = new MatTableDataSource<Moneda>([]);
  monedasDisplayedColumns = ["denominacion", "simbolo", "cambio", "accion"];
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  // Configuración
  configuracion: FinancieroConfiguracionData = {
    paginacionTamano: 10,
    mostrarMonedas: true,
    mostrarAccesosRapidos: true
  };

  constructor(
    public tabService: TabService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private pagoDetalleCuotaService: PagoDetalleCuotaService,
    private pagoDetalleService: PagoDetalleService,
    private monedaService: MonedaService,
    private cambioService: CambioService,
    private sucursalService: SucursalService,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Cargar configuración guardada si existe
    this.cargarConfiguracion();
    
    this.cargarCuotasPendientes();
    this.cargarMonedas();
    this.cargarSucursales();
  }
  
  ngAfterViewInit() {
    this.cuotasPendientesDataSource.paginator = this.paginator;
    this.cuotasPendientesDataSource.sort = this.sort;
    
    // Subscribe to paginator events
    this.paginator.page.pipe(untilDestroyed(this)).subscribe(() => {
      this.currentPage = this.paginator.pageIndex;
      this.pageSize = this.paginator.pageSize;
      this.aplicarFiltros();
    });
  }
  
  cargarSucursales(): void {
    this.sucursalService.onGetAllSucursales(true).subscribe((res) => {
      if (res) {
        this.sucursales = res;
      }
    });
  }
  
  cargarCuotasPendientes(): void {
    this.pagoDetalleCuotaService.onFiltrarPagoDetalleCuotas(
      undefined, undefined, undefined, undefined, 
      this.currentPage, this.pageSize
    )
    .pipe(untilDestroyed(this))
    .subscribe(result => {
      if (result) {
        this.cuotasPendientesDataSource.data = result.getContent || [];
        this.totalElements = result.getTotalElements || 0;
        
        // Update paginator without triggering an event
        if (this.paginator) {
          this.paginator.length = this.totalElements;
        }
      }
    });
  }
  
  cargarMonedas(): void {
    this.monedaService.onGetAll()
      .pipe(untilDestroyed(this))
      .subscribe(monedas => {
        if (monedas) {
          this.monedasDataSource.data = monedas.filter(m => m.denominacion !== 'GUARANI');
        }
      });
  }
  
  aplicarFiltros(): void {
    const estadoSeleccionado = this.filtroEstado.value;
    const sucursalId = this.filtroSucursal.value?.id;
    const fechaDesde = this.filtroFechaDesde.value;
    const fechaHasta = this.filtroFechaHasta.value;
    const filtrarPorCreacion = this.filtrarPorCreacion.value;
    
    // If filtering by creation date rather than due date, we need to pass this to the backend
    // or handle it in the frontend depending on your backend capabilities
    
    this.pagoDetalleCuotaService.onFiltrarPagoDetalleCuotas(
      estadoSeleccionado, 
      sucursalId,
      fechaDesde, 
      fechaHasta,
      this.currentPage,
      this.pageSize,
      filtrarPorCreacion
    )
    .pipe(untilDestroyed(this))
    .subscribe(result => {
      if (result) {
        this.cuotasPendientesDataSource.data = result.getContent || [];
        this.totalElements = result.getTotalElements || 0;
        
        // Update paginator without triggering an event
        if (this.paginator) {
          this.paginator.length = this.totalElements;
        }
      }
    });
  }
  
  abrirModuloGastos(): void {
    this.tabService.addTab(new Tab(ListGastosComponent, "Gastos"));
  }
  
  abrirModuloRetiros(): void {
    this.tabService.addTab(new Tab(ListRetiroComponent, "Retiros"));
  }
  
  abrirModuloSolicitudPago(): void {
    this.tabService.addTab(new Tab(ListSolicitudPagoComponent, "Solicitudes de Pago"));
  }
  
  abrirModuloCambio(): void {
    this.tabService.addTab(new Tab(CambioComponent, "Cambio"));
  }
  
  actualizarCambio(moneda: Moneda): void {
    this.matDialog.open(CrearCambioDialogComponent, {
      data: {
        moneda: moneda
      }
    }).afterClosed().subscribe(res => {
      if (res && res['cambio']) {
        this.cargarMonedas();
      }
    });
  }
  
  actualizarDatos(): void {
    this.cargarCuotasPendientes();
    this.cargarMonedas();
    this.notificacionService.openSucess("Datos actualizados correctamente");
  }
  
  limpiarFiltros(): void {
    this.filtroEstado.setValue('TODOS');
    this.filtroSucursal.setValue(null);
    this.filtroFechaDesde.setValue(null);
    this.filtroFechaHasta.setValue(null);
    this.filtrarPorCreacion.setValue(false);
    this.aplicarFiltros();
  }

  // Métodos para las acciones del menú
  
  /**
   * Método para realizar pago de una cuota
   * @param cuota La cuota a pagar
   */
  realizarPago(cuota: PagoDetalleCuota): void {
    // Por implementar
    console.log('Realizar pago para cuota:', cuota);
  }
  
  /**
   * Método para ver o editar un pago
   * @param cuota La cuota para ver/editar
   */
  verEditarPago(cuota: PagoDetalleCuota): void {
    // Por implementar
    console.log('Ver/Editar pago para cuota:', cuota);
  }
  
  /**
   * Actualiza la sucursal y caja de un PagoDetalle
   * @param pagoDetalleCuota Cuota cuyo PagoDetalle se actualizará
   * @param sucursal Nueva sucursal
   * @param caja Nueva caja (opcional)
   * @returns Promise que se resuelve cuando la actualización se completa
   */
  updatePagoDetalleSucursalYCaja(pagoDetalleCuota: PagoDetalleCuota, sucursal: Sucursal, caja?: PdvCaja): Promise<boolean> {
    if (!pagoDetalleCuota || !pagoDetalleCuota.pagoDetalle || !pagoDetalleCuota.pagoDetalle.id) {
      this.notificacionService.openWarn('No se encontró el detalle de pago para actualizar');
      return Promise.resolve(false);
    }

    const pagoDetalleId = pagoDetalleCuota.pagoDetalle.id;
    const sucursalId = sucursal.id;
    const cajaId = caja?.id;

    return new Promise((resolve, reject) => {
      this.pagoDetalleService.onUpdatePagoDetalleCajaySucursal(pagoDetalleId, sucursalId, cajaId)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (result) => {
            if (result) {
              this.notificacionService.openSucess('Sucursal y caja actualizadas correctamente');
              resolve(true);
            } else {
              this.notificacionService.openWarn('No se pudo actualizar la sucursal y caja');
              resolve(false);
            }
          },
          error: (error) => {
            console.error('Error al actualizar sucursal y caja:', error);
            this.notificacionService.openWarn('Error al actualizar la sucursal y caja: ' + (error.message || 'Error desconocido'));
            reject(error);
          }
        });
    });
  }

  /**
   * Método para modificar la sucursal de una cuota
   * @param cuota La cuota para modificar sucursal
   */
  modificarSucursal(cuota: PagoDetalleCuota): void {
    // Open the dialog to select a new sucursal
    this.matDialog.open(ModificarSucursalPagoDetalleComponent, {
      width: '900px',
      panelClass: 'modificar-sucursal-dialog',
      data: {
        pagoDetalleCuota: cuota
      }
    }).afterClosed().subscribe(result => {
      if (result && result.sucursal) {
        // Update the PagoDetalle with the new sucursal and caja
        this.updatePagoDetalleSucursalYCaja(cuota, result.sucursal, result.caja)
          .then(() => {
            // Refresh the list after updating
            this.aplicarFiltros();
          })
          .catch(error => {
            console.error('Error in modificarSucursal:', error);
          });
      }
    });
  }

  /**
   * Abre el diálogo de configuración financiera
   */
  abrirConfiguracion(): void {
    this.matDialog.open(FinancieroConfiguracionDialogComponent, {
      width: '500px',
      data: this.configuracion
    }).afterClosed().subscribe(result => {
      if (result) {
        // Actualizar la configuración local
        this.configuracion = result;
        
        // Guardar configuración en localStorage
        this.guardarConfiguracion();
        
        // Aplicar cambios de configuración
        if (this.paginator) {
          this.paginator.pageSize = this.configuracion.paginacionTamano;
          this.pageSize = this.configuracion.paginacionTamano;
          this.aplicarFiltros();
        }
        
        this.notificacionService.openSucess('Configuración actualizada');
      }
    });
  }

  /**
   * Carga la configuración guardada en localStorage si existe
   */
  cargarConfiguracion(): void {
    const configuracionGuardada = localStorage.getItem('financieroDashboardConfig');
    if (configuracionGuardada) {
      try {
        const config = JSON.parse(configuracionGuardada);
        this.configuracion = { ...this.configuracion, ...config };
        this.pageSize = this.configuracion.paginacionTamano;
      } catch (e) {
        console.error('Error al cargar configuración:', e);
      }
    }
  }
  
  /**
   * Guarda la configuración actual en localStorage
   */
  guardarConfiguracion(): void {
    localStorage.setItem('financieroDashboardConfig', JSON.stringify(this.configuracion));
  }
}
