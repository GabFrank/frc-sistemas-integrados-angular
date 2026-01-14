import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  Input,
  AfterViewInit,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { MatDialog } from "@angular/material/dialog";
import { Subject, forkJoin, Observable } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";

import {
  AddEditItemDialogComponent,
  AddEditItemDialogData,
  AddEditItemDialogResult,
} from "./dialogs/add-edit-item-dialog/add-edit-item-dialog.component";
import {
  DistributeItemDialogComponent,
  DistributeItemDialogData,
  DistributeItemDialogResult,
} from "./dialogs/distribute-item-dialog/distribute-item-dialog.component";
import {
  AddEditNotaRecepcionDialogComponent,
  AddEditNotaRecepcionDialogData,
  AddEditNotaRecepcionDialogResult,
} from "./dialogs/add-edit-nota-recepcion-dialog/add-edit-nota-recepcion-dialog.component";
import {
  DividirItemDialogComponent,
  DividirItemDialogData,
  DividirItemDialogResult,
} from "./dialogs/dividir-item-dialog/dividir-item-dialog.component";
import {
  RechazarItemDialogComponent,
  RechazarItemDialogData,
  RechazarItemDialogResult,
} from "./dialogs/rechazar-item-dialog/rechazar-item-dialog.component";
import { Pedido } from "./pedido.model";
import { PedidoItem, PedidoItemEstado } from "./pedido-item.model";
import { PedidoItemDistribucion } from "./pedido-item-distribucion.model";
import {
  ProcesoEtapa,
  ProcesoEtapaTipo,
  ProcesoEtapaEstado,
} from "./proceso-etapa.model";
import { NotaRecepcion, NotaRecepcionEstado } from "./nota-recepcion.model";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { Vendedor } from "../../../personas/vendedor/vendedor.model";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Producto } from "../../../productos/producto/producto.model";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { PedidoResumen } from "./graphql/getPedidoResumen";

// Services
import { MonedaService } from "../../../financiero/moneda/moneda.service";
import { FormaPagoService } from "../../../financiero/forma-pago/forma-pago.service";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
  TableData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { PdvSearchProductoDialogComponent } from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { ProveedoresSearchByPersonaGQL } from "../../../personas/proveedor/graphql/proveedorSearchByPersona";
import { VendedoresSearchByPersonaGQL } from "../../../personas/vendedor/graphql/vendedorSearchByPersona";
import { ProveedorService } from "../../../personas/proveedor/proveedor.service";
import { PedidoService } from "../pedido.service";
import { MatSelect } from "@angular/material/select";
import { MatButton } from "@angular/material/button";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { ProcesoEtapaService } from "./proceso-etapa.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabData } from "../../../../layouts/tab/tab.service";
import { ProductoProveedorService } from "../../../productos/producto-proveedor/producto-proveedor.service";
import { ProductoProveedor } from "../../../productos/producto-proveedor/producto-proveedor.model";
import { ProductoUltimasComprasByIdGQL } from "../../../productos/producto/graphql/productoUltimasComprasPorId";
import { DesvincularProductoProveedorGQL } from "../../../productos/producto-proveedor/graphql/desvincularProductoProveedor";

interface PedidoHeader {
  id?: number;
  proveedor: string;
  fechaCreacion: Date;
  estado: string;
  montoTotal: number;
  moneda: Moneda;
  plazoCredito: number;
}

interface MockSucursal {
  id: number;
  nombre: string;
  direccion?: string;
}

interface MockProducto {
  id: number;
  descripcion: string;
  codigoPrincipal: string;
}

interface MockPedidoItem extends PedidoItem {
  // Additional frontend computed properties
  distribuciones: PedidoItemDistribucion[];
  subtotalComputed: number;
  distributionStatusTextComputed: string;
  distributionStatusClassComputed: string;
  isSelectedComputed?: boolean; // Para step 3
  cantidadPendienteComputed?: number; // Para step 3 - cantidad pendiente de conciliar
}

interface MockNotaRecepcion extends NotaRecepcion {
  // Additional frontend computed properties
  fechaFormattedComputed: string;
  estadoChipColorComputed: string;
  estadoDisplayNameComputed: string;
  isSelectedComputed: boolean;
  // Propiedades específicas para notas de rechazo
  isNotaRechazoComputed: boolean;
  // Propiedad para el monto total de la nota
  montoComputed: number;
  // Propiedad para el valor total calculado en el backend
  valorTotal?: number;
}

interface ProductoProveedorItem extends ProductoProveedor {
  // Computed properties
  descripcionComputed: string;
  precioDisplayComputed: string;
  isSelectedComputed: boolean;
}

interface UltimaCompraItem {
  pedido: Pedido;
  cantidad: number;
  precio: number;
  creadoEn: Date;
  // Computed properties
  fechaDisplayComputed: string;
  proveedorDisplayComputed: string;
  precioDisplayComputed: string;
}

type TabState = "disabled" | "readonly" | "editable";

/**
 * Componente principal para la gestión de compras
 * 
 * Comportamiento:
 * - Si se recibe un ID de pedido: Modo edición - cargar pedido existente
 * - Si NO se recibe ID: Modo nueva compra - solo habilitar tab de Datos Generales
 * 
 * En modo nueva compra:
 * - Solo se puede acceder al tab de Datos Generales
 * - Los otros tabs están deshabilitados hasta que se guarde el pedido
 * - Al guardar el pedido, se cambia automáticamente a modo edición
 */
@Component({
  selector: "app-gestion-compras",
  templateUrl: "./gestion-compras.component.html",
  styleUrls: ["./gestion-compras.component.scss"],
})
export class GestionComprasComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild("monedaSelect", { read: MatSelect }) monedaSelect!: MatSelect;
  @ViewChild("proveedorInput") proveedorInput!: any;
  @ViewChild("vendedorInput") vendedorInput!: any;
  @ViewChild("sucursalEntregaSelect", { read: MatSelect }) sucursalEntregaSelect!: MatSelect;
  @ViewChild("sucursalInfluenciaSelect", { read: MatSelect }) sucursalInfluenciaSelect!: MatSelect;
  @ViewChild("formaPagoSelect", { read: MatSelect }) formaPagoSelect!: MatSelect;
  @ViewChild("plazoCreditoInput") plazoCreditoInput!: any;
  @ViewChild("continuarButton", { read: MatButton }) continuarButton!: MatButton;
  @ViewChild("addItemButton", { read: MatButton }) addItemButton!: MatButton;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("itemsPendientesPaginator", { read: MatPaginator }) itemsPendientesPaginator!: MatPaginator;
  @ViewChild("notasRecepcionPaginator", { read: MatPaginator }) notasRecepcionPaginator!: MatPaginator;
  @Input() data: Tab; // Tab object from TabService

  private destroy$ = new Subject<void>();

  // Estado de carga
  loadingPedido = false;
  pedidoId: number | null = null;
  isEditMode = false; // true si estamos editando un pedido existente

  // Navegación por Pestañas (Tabs)
  previousTabIndex = 0;
  selectedTabIndex = 0;
  isTabLoaded = false;

  // Estados de las pestañas (reemplaza los booleans anteriores)
  datosGeneralesTabState: TabState = "editable";
  itemsTabState: TabState = "disabled";
  notasTabState: TabState = "disabled";
  mercaderiaTabState: TabState = "disabled";
  pagoTabState: TabState = "disabled";

  // Current pedido instance
  currentPedido: Pedido | null = null;

  // Pedido resumen from backend (for edit mode)
  pedidoResumen: PedidoResumen | null = null;

  // Header data - computed properties (no getters!)
  headerDataComputed: PedidoHeader = {
    proveedor: "",
    fechaCreacion: new Date(),
    estado: "EN PLANIFICACIÓN",
    montoTotal: 0,
    moneda: null,
    plazoCredito: 0,
  };

  // Computed properties para UI (siguiendo regla @no-direct-function-calls-in-template.mdc)
  estadoChipColorComputed = "primary";
  vendedorDisplayTextComputed = "";
  isFormaPagoCreditoComputed = false;
  step1ButtonDisabledComputed = true;
  step1ButtonTextComputed = "Guardar y Continuar";
  canFinalizarPlanificacionComputed = false; // Para el botón Finalizar Planificación

  // Forms
  datosGeneralesForm: FormGroup;
  itemsForm: FormGroup;
  step3Form: FormGroup;
  step4Form: FormGroup;
  step5Form: FormGroup;

  // Items table
  itemsDataSource = new MatTableDataSource<MockPedidoItem>([]);
  itemsDisplayedColumns = [
    "producto",
    "cantidadSolicitada",
    "precioUnitario",
    "subtotal",
    "distribucion",
    "vencimiento",
    "acciones",
  ];

  // Items computed properties (avoid getters!)
  itemsCountComputed = 0;
  distributedItemsCountComputed = 0;
  pendingDistributionCountComputed = 0;
  // Removed hasItemsComputed and canFinalizePlanningComputed - using direct logic in template

  // Paginación para ítems del pedido
  itemsPageSize = 10;
  itemsPageIndex = 0;
  itemsTotalElements = 0;
  itemsLoading = false;
  itemsSearchText = '';
  showItemsSearch = false;

  // Step 3: Layout de dos paneles según manual
  // Panel Izquierdo (60%): Ítems del Pedido Pendientes de Conciliar
  itemsPendientesDataSource = new MatTableDataSource<MockPedidoItem>([]);
  itemsPendientesDisplayedColumns = [
    "seleccionar",
    "producto",
    "cantidadPendiente",
    "estadoDistribucion",
    "acciones",
  ];
  selectedItemsPendientes: MockPedidoItem[] = [];

  // Paginación para ítems pendientes
  itemsPendientesPageSize = 10;
  itemsPendientesPageIndex = 0;
  itemsPendientesTotalElements = 0;
  itemsPendientesLoading = false;
  itemsPendientesSearchText = '';

  // Panel Derecho (40%): Notas de Recepción Registradas
  notasRecepcionDataSource = new MatTableDataSource<MockNotaRecepcion>([]);
  notasRecepcionDisplayedColumns = ["numero", "fecha", "monto", "estado", "acciones"];
  selectedNotaRecepcion: MockNotaRecepcion | null = null;

  // Paginación para notas de recepción
  notasRecepcionPageSize = 10;
  notasRecepcionPageIndex = 0;
  notasRecepcionTotalElements = 0;
  notasRecepcionLoading = false;
  notasRecepcionSearchText = '';

  // Computed properties para Step 3
  itemsPendientesCountComputed = 0;
  notasRecepcionCountComputed = 0;
  canCreateNotaForItemsComputed = false;
  canAssignItemsToNotaComputed = false;
  canFinalizarConciliacionComputed = false;

  // Productos del proveedor y últimas compras
  productosProveedorDataSource = new MatTableDataSource<ProductoProveedorItem>([]);
  ultimasComprasDataSource = new MatTableDataSource<UltimaCompraItem>([]);
  selectedProductoProveedor: ProductoProveedorItem | null = null;
  productosProveedorLoading = false;
  ultimasComprasLoading = false;
  productosProveedorPageSize = 10;
  productosProveedorPageIndex = 0;
  productosProveedorTotalElements = 0;
  productosProveedorSearchText = '';
  ultimasComprasPageSize = 5;
  ultimasComprasPageIndex = 0;
  ultimasComprasTotalElements = 0;
  ultimasComprasAllData: UltimaCompraItem[] = [];
  lastClickTime = 0;
  lastClickedProduct: ProductoProveedorItem | null = null;

  // Sistema de lazy loading para tabs
  loadedTabs: Set<number> = new Set();

  // Propiedades de habilitación de tabs
  tabDatosGeneralesEnabled = true; // Siempre habilitado
  tabItemsEnabled = false;
  tabNotasEnabled = false;
  tabMercaderiaEnabled = false;
  tabPagoEnabled = false;

  // Data lists for selects
  monedas: Moneda[] = [];
  formasPago: FormaPago[] = [];
  sucursales: Sucursal[] = [];

  // Navigation properties
  selectedProveedorComputed: Proveedor | null = null;
  showProveedorCard = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private monedaService: MonedaService,
    private formaPagoService: FormaPagoService,
    private sucursalService: SucursalService,
    private proveedorSearchGQL: ProveedoresSearchByPersonaGQL,
    private vendedorSearchGQL: VendedoresSearchByPersonaGQL,
    private proveedorService: ProveedorService,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionSnackbarService,
    private procesoEtapaService: ProcesoEtapaService,
    private dialogosService: DialogosService,
    private productoProveedorService: ProductoProveedorService,
    private productoUltimasComprasGQL: ProductoUltimasComprasByIdGQL,
    private desvincularProductoProveedorGQL: DesvincularProductoProveedorGQL
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    const pedidoId = this.data?.tabData?.id || this.data?.tabData?.data?.id;
    
    if (pedidoId) {
      this.pedidoId = pedidoId;
      this.isEditMode = true;
    } else {
      this.pedidoId = null;
      this.isEditMode = false;
    }

    const initialData$ = this.loadInitialData();
    
    if (this.isEditMode && this.pedidoId) {
      initialData$.subscribe(() => {
        this.loadPedidoExistente();
      });
    } else {
      initialData$.subscribe(() => {
        this.setupNuevaCompraState();
        this.loadTabDataIfNeeded(0);
        this.updateComputedProperties();
      });
    }
  }

  ngAfterViewInit() {
    this.itemsDataSource.paginator = this.paginator;
    
    // Configurar paginador para ítems pendientes
    if (this.itemsPendientesPaginator) {
      this.itemsPendientesDataSource.paginator = this.itemsPendientesPaginator;
    }

    // Configurar paginador para notas de recepción
    if (this.notasRecepcionPaginator) {
      this.notasRecepcionDataSource.paginator = this.notasRecepcionPaginator;
    }

    // Estado de tabs configurado
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.datosGeneralesForm = this.fb.group({
      proveedor: ["", Validators.required],
      vendedor: [""],
      moneda: ["", Validators.required],
      formaPago: ["", Validators.required],
      plazoCredito: [0],
      sucursalesEntrega: [[], Validators.required],
      sucursalesInfluencia: [[], Validators.required],
    });

    // Items form - always valid for navigation purposes
    this.itemsForm = this.fb.group({
      hasItems: [true], // Always valid to allow navigation
    });

    // Placeholder forms for other steps
    this.step3Form = this.fb.group({
      completed: [false],
    });

    this.step4Form = this.fb.group({
      completed: [false],
    });

    this.step5Form = this.fb.group({
      completed: [false],
    });

    // update computed properties when form changes
    this.datosGeneralesForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateComputedProperties();
      });

    this.datosGeneralesForm
      .get("proveedor")
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (typeof value === "object" && value !== null) {
          this.selectedProveedorComputed = value;
          this.showProveedorCard = true;
          this.vendedorDisplayTextComputed = value.vendedor?.persona?.nombre;
          this.datosGeneralesForm
            .get("vendedor")
            ?.setValue(value.vendedor, { emitEvent: false });
          
          // Si estamos en el tab de items, cargar productos del proveedor
          if (this.selectedTabIndex === 1) {
            this.loadProductosProveedor();
          }
        } else {
          // Si se remueve el proveedor, limpiar la lista de productos
          this.productosProveedorDataSource.data = [];
          this.ultimasComprasDataSource.data = [];
          this.ultimasComprasAllData = [];
          this.ultimasComprasTotalElements = 0;
          this.ultimasComprasPageIndex = 0;
          this.selectedProductoProveedor = null;
        }
      });
  }

  private loadInitialData(): Observable<any> {
    return forkJoin({
      monedas: this.monedaService.onGetAll(),
      formasPago: this.formaPagoService.onGetAllFormaPago(),
      sucursales: this.sucursalService.onGetAllSucursales()
    }).pipe(
      tap(({ monedas, formasPago, sucursales }) => {
        this.monedas = monedas;
        this.formasPago = formasPago;
        this.sucursales = sucursales;

        // Initialize with default values if available
        if (monedas.length > 0 && !this.datosGeneralesForm.get("moneda")?.value) {
          this.datosGeneralesForm.patchValue({ moneda: monedas[0] }, { emitEvent: false });
        }
        if (formasPago.length > 0 && !this.datosGeneralesForm.get("formaPago")?.value) {
          this.datosGeneralesForm.patchValue({ formaPago: formasPago[0] }, { emitEvent: false });
        }
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Configura el estado inicial para una nueva compra
   * Establece los estados de tabs y propiedades iniciales
   */
  private setupNuevaCompraState(): void {
    // Configurar estados de tabs para nueva compra
    this.datosGeneralesTabState = "editable";
    this.itemsTabState = "editable";
    this.notasTabState = "disabled";
    this.mercaderiaTabState = "disabled";
    this.pagoTabState = "disabled";
    
    // Configurar propiedades de habilitación de tabs
    this.tabDatosGeneralesEnabled = true;
    this.tabItemsEnabled = true;
    this.tabNotasEnabled = false;
    this.tabMercaderiaEnabled = false;
    this.tabPagoEnabled = false;
    
    // Establecer tab inicial
    this.selectedTabIndex = 0;
    this.previousTabIndex = 0;
    this.isTabLoaded = true;
    
    // Limpiar datos de carga
    this.loadingPedido = false;
    this.currentPedido = null;
    this.pedidoResumen = null;
    
    // Limpiar conjunto de tabs cargados
    this.loadedTabs.clear();
  }

  /**
   * Carga un pedido existente desde el backend
   * Solo se ejecuta cuando isEditMode = true y hay un pedidoId
   */
  private loadPedidoExistente(): void {
    if (!this.pedidoId || !this.isEditMode) {
      return;
    }

    this.loadingPedido = true;

    // Cargar pedido, ítems y etapa actual en paralelo
    forkJoin({
      pedido: this.pedidoService.onGetPedidoById(this.pedidoId!),
      etapaActual: this.procesoEtapaService.onGetEtapaActual(this.pedidoId!),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.currentPedido = result.pedido;
          this.loadPedidoIntoForm(result.pedido);


          // Determinar el estado de los tabs y el tab activo
          // Esto también cargará automáticamente los datos del tab inicial
          this.updateTabStates(result.etapaActual);

          this.loadingPedido = false;
          
          // Cargar el resumen completo del pedido desde el backend
          this.loadPedidoResumen();
          
          this.updateComputedProperties();

          // Pedido cargado exitosamente
        },
        error: (error) => {
          console.error("Error cargando datos del pedido existente:", error);
          this.notificacionService.openAlgoSalioMal("Error al cargar los datos del pedido existente");
          this.loadingPedido = false;
        },
      });
  }

  /**
   * Carga el resumen del pedido desde el backend
   */
  private loadPedidoResumen(): void {
    if (!this.pedidoId) return;

    this.pedidoService.onGetPedidoResumen(this.pedidoId).subscribe({
      next: (resumen) => {
        this.pedidoResumen = resumen;
        this.updateComputedProperties();
        
        // Si estamos en el tab 3, actualizar también las propiedades del step 3
        // para que el botón de finalizar conciliación se actualice con la etapa correcta
        if (this.selectedTabIndex === 2) {
          this.updateStep3ComputedProperties();
        }
        
        // Si estamos en el tab de Items y el estado es EN PLANIFICACION, hacer focus en el botón "Añadir Item"
        if (this.selectedTabIndex === 1 && this.isEstadoEnPlanificacion()) {
          setTimeout(() => {
            this.focusAddItemButton();
          }, 100);
        }
      },
      error: (error) => {
        console.error("Error cargando resumen del pedido:", error);
        // No mostrar error al usuario, usar cálculo local como fallback
      },
    });
  }

  /**
   * Carga solo la información básica del pedido para el header
   * Sin cargar datos de ítems que pueden no ser necesarios inicialmente
   */
  private loadPedidoResumenBasico(): void {
    if (!this.pedidoId) return;

    // Por ahora, crear un resumen básico con los datos que ya tenemos
    // En el futuro, se puede crear un endpoint específico para esto
    if (this.currentPedido) {
      this.pedidoResumen = {
        pedidoId: this.currentPedido.id.toString(),
        etapaActual: null, // Se establece en updateTabStates
        cantidadItems: 0, // Se calculará cuando se cargue el tab de ítems
        valorTotal: 0, // Se calculará cuando se cargue el tab de ítems
        cantidadItemsConDistribucionCompleta: 0, // Se calculará cuando se cargue el tab de ítems
        cantidadItemsPendientesDistribucion: 0 // Se calculará cuando se cargue el tab de ítems
      };
      this.updateComputedProperties();
      console.log("Resumen básico del pedido creado");
    }
  }

  private loadPedidoIntoForm(pedido: Pedido): void {
    // Llenar el formulario con los datos del pedido
    this.datosGeneralesForm.patchValue({
      proveedor: pedido.proveedor,
      vendedor: pedido.vendedor,
      moneda: pedido.moneda != null ? this.monedas.find((m) => m.id === pedido.moneda.id) : null,
      formaPago: pedido.formaPago != null ? this.formasPago.find((f) => f.id === pedido.formaPago.id) : null,
      plazoCredito: pedido.plazoCredito || 0,
      // TODO: Cargar sucursales de entrega e influencia cuando estén disponibles en el backend
      // extract sucursales from pedido.sucursalEntregaList and pedido.sucursalInfluenciaList
      sucursalesEntrega: pedido.sucursalEntregaList.map((sucursal) =>
        sucursal.sucursal != null ? this.sucursales.find((s) => s.id === sucursal.sucursal.id) : null
      ),
      sucursalesInfluencia: pedido.sucursalInfluenciaList.map((sucursal) =>
        sucursal.sucursal != null ? this.sucursales.find((s) => s.id === sucursal.sucursal.id) : null
      ),
    });

    // Establecer proveedor seleccionado para mostrar la tarjeta
    this.selectedProveedorComputed = pedido.proveedor;
    this.showProveedorCard = true;
  }

  private loadItemsIntoTable(items: PedidoItem[]): void {
    // TODO: Implement this
  }

  // Métodos para determinar el texto y comportamiento de los botones
  getStep1ButtonText(): string {
    return this.isEditMode ? "Actualizar Datos Generales" : "Guardar y Continuar";
  }

  // Removed getStep2ButtonText() - using direct text in template

  shouldDisableStep1Button(): boolean {
    // make disabled if form is not touched by user
    return this.datosGeneralesForm.invalid || this.datosGeneralesTabState !== "editable" || !this.datosGeneralesForm.dirty;
  }

  /**
   * Calcula si se puede finalizar la planificación del pedido
   * Solo habilitado si:
   * 1. Hay ítems en el pedido
   * 2. La etapa es CREACION
   * 3. El estado es EN_PROCESO
   */
  private canFinalizarPlanificacion(): boolean {
    // Verificar que hay ítems
    const hasItems = this.itemsDataSource.data.length > 0;
    
    // Verificar etapa y estado
    let etapaCorrecta = false;
    let estadoCorrecto = false;
    
    if (this.currentPedido?.procesoEtapas) {
      const etapaCreacion = this.currentPedido.procesoEtapas.find(
        e => e.tipoEtapa === ProcesoEtapaTipo.CREACION
      );
      etapaCorrecta = !!etapaCreacion;
      estadoCorrecto = etapaCreacion?.estadoEtapa === ProcesoEtapaEstado.EN_PROCESO;
    }
    
    const canFinalizar = hasItems && etapaCorrecta && estadoCorrecto;
    
    
    return canFinalizar;
  }

  // Step 1: Modificar el comportamiento del botón
  onContinuarStep1(): void {
    if (this.datosGeneralesForm.valid) {
      if (this.isEditMode) {
        this.updatePedidoCabecera();
      } else {
        this.savePedidoCabecera();
      }
    } else {
      console.error("Formulario inválido");
      // Mark all fields as touched to show validation errors
      Object.keys(this.datosGeneralesForm.controls).forEach((key) => {
        this.datosGeneralesForm.get(key)?.markAsTouched();
      });
    }
  }

  // Nuevo método para actualizar pedido existente
  private updatePedidoCabecera(): void {
    const formValue = this.datosGeneralesForm.value;

    // Create PedidoInput from form with existing ID
    // Incluir creadoEn del pedido actual para preservarlo al actualizar
    const pedidoInput = {
      id: this.currentPedido!.id, // Incluir el ID para actualizar
      proveedorId: formValue.proveedor?.id,
      vendedorId: formValue.vendedor?.id,
      monedaId: formValue.moneda?.id,
      formaPagoId: formValue.formaPago?.id,
      plazoCredito: formValue.plazoCredito,
      usuarioId: this.currentPedido!.usuario?.id || 1, // Mantener el usuario original
      creadoEn: this.currentPedido!.creadoEn ? dateToString(this.currentPedido!.creadoEn) : undefined, // Preservar creadoEn del pedido actual
    };

    // Extract sucursal IDs
    const sucursalEntregaList = formValue.sucursalesEntrega?.map((s: any) => s.id) || [];
    const sucursalInfluenciaList = formValue.sucursalesInfluencia?.map((s: any) => s.id) || [];

    // Call service to update pedido
    this.pedidoService
      .onSavePedidoFull(
        pedidoInput,
        [], // fechaEntregaList - Empty for now, can be added later
        sucursalEntregaList,
        sucursalInfluenciaList,
        this.currentPedido!.usuario?.id || 1
      )
      .subscribe({
        next: (result) => {
          console.log("Pedido actualizado exitosamente:", result);
          this.currentPedido = result;

          // Marcar el formulario como pristine después de guardar exitosamente
          // Esto evita que se muestre el diálogo de "cambios no guardados" al cambiar de tab
          this.datosGeneralesForm.markAsPristine();

          // Recargar el pedido completo para obtener procesoEtapas actualizado
          // Esto es necesario porque savePedidoFull ahora devuelve procesoEtapas, pero
          // también recargamos para asegurar que todos los datos estén sincronizados
          if (result.id) {
            this.pedidoService.onGetPedidoById(result.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (pedidoCompleto) => {
                  this.currentPedido = pedidoCompleto;
                  
                  // Actualizar propiedades computadas después de recargar
                  this.updateComputedProperties();
                  
                  // Actualizar propiedades de items para habilitar botón "Finalizar Planificación"
                  this.updateItemsComputedProperties();
                },
                error: (error) => {
                  console.error("Error recargando pedido completo:", error);
                  // Continuar con el resultado del save aunque falle la recarga
                  this.updateComputedProperties();
                  this.updateItemsComputedProperties();
                }
              });
          } else {
            // Si no hay ID, solo actualizar propiedades computadas
            this.updateComputedProperties();
            this.updateItemsComputedProperties();
          }

          // Mostrar mensaje de éxito
          this.notificacionService.openSucess("Datos generales actualizados exitosamente");

          // Navegar a la pestaña de ítems si estamos en la primera pestaña
          if (this.selectedTabIndex === 0) {
            this.selectedTabIndex = 1;
          }
        },
        error: (error) => {
          console.error("Error actualizando pedido:", error);
          this.notificacionService.openAlgoSalioMal("Error al actualizar el pedido");
        },
      });
  }

  // Método original para crear nuevos pedidos
  private savePedidoCabecera(): void {
    const formValue = this.datosGeneralesForm.value;

    // Create PedidoInput from form
    const pedidoInput = {
      proveedorId: formValue.proveedor?.id,
      vendedorId: formValue.vendedor?.id,
      monedaId: formValue.moneda?.id,
      formaPagoId: formValue.formaPago?.id,
      plazoCredito: formValue.plazoCredito,
      usuarioId: 1, // TODO: Get from auth service
    };

    // Extract sucursal IDs
    const sucursalEntregaList = formValue.sucursalesEntrega?.map((s: any) => s.id) || [];
    const sucursalInfluenciaList = formValue.sucursalesInfluencia?.map((s: any) => s.id) || [];

    // Call service to save pedido
    this.pedidoService
      .onSavePedidoFull(
        pedidoInput,
        [], // fechaEntregaList - Empty for now, can be added later
        sucursalEntregaList,
        sucursalInfluenciaList,
        1, // TODO: Get from auth service
      )
      .subscribe({
        next: (result) => {
          console.log("Pedido guardado exitosamente:", result);
          this.currentPedido = result;
          this.isEditMode = true; // Cambiamos a modo edición
          this.pedidoId = result.id;

          // Marcar el formulario como pristine después de guardar exitosamente
          // Esto evita que se muestre el diálogo de "cambios no guardados" al cambiar de tab
          this.datosGeneralesForm.markAsPristine();

          // Recargar el pedido completo para obtener procesoEtapas actualizado
          // Esto es necesario porque savePedidoFull ahora devuelve procesoEtapas, pero
          // también recargamos para asegurar que todos los datos estén sincronizados
          if (result.id) {
            this.pedidoService.onGetPedidoById(result.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (pedidoCompleto) => {
                  this.currentPedido = pedidoCompleto;
                  
                  // Actualizar propiedades computadas después de recargar
                  this.updateComputedProperties();
                  
                  // Actualizar propiedades de items para habilitar botón "Finalizar Planificación"
                  // Nota: itemsDataSource puede estar vacío aún, pero se actualizará cuando se cargue el tab
                  this.updateItemsComputedProperties();
                },
                error: (error) => {
                  console.error("Error recargando pedido completo:", error);
                  // Continuar con el resultado del save aunque falle la recarga
                  this.updateComputedProperties();
                  this.updateItemsComputedProperties();
                }
              });
          } else {
            // Si no hay ID, solo actualizar propiedades computadas
            this.updateComputedProperties();
            this.updateItemsComputedProperties();
          }

          // Navegar a la pestaña de ítems
          this.selectedTabIndex = 1;
        },
        error: (error) => {
          console.error("Error guardando pedido:", error);
          this.notificacionService.openAlgoSalioMal("Error al guardar el pedido");
        },
      });
  }

  private calculateItemComputedProperties(item: PedidoItem): void {
    // Calculate subtotal
    // TODO: Implementar algo aqui
  }

  private updateComputedProperties(): void {
    // Update header data from form values or current pedido
    const formValue = this.datosGeneralesForm.value;

    // Si estamos en modo edición y tenemos resumen del backend, usarlo
    if (this.isEditMode && this.currentPedido) {
      this.headerDataComputed = {
        id: this.currentPedido.id,
        proveedor: this.currentPedido?.proveedor?.persona?.nombre ||
                   this.selectedProveedorComputed?.persona?.nombre ||
                   formValue.proveedor?.persona?.nombre ||
                   "No seleccionado",
        fechaCreacion: this.currentPedido?.creadoEn || new Date(),
        estado: this.pedidoResumen 
                ? this.getEstadoFromResumen(this.pedidoResumen.etapaActual)
                : this.getEstadoGeneral(),
        montoTotal: this.calculateMontoTotalEditMode(),
        moneda: this.currentPedido?.moneda || null,
        plazoCredito: this.currentPedido?.plazoCredito || 0,
      };
    } else {
      // Modo nueva compra o sin resumen - usar datos del formulario y valores por defecto
      this.headerDataComputed = {
        id: undefined, // Nueva compra no tiene ID
        proveedor: this.selectedProveedorComputed?.persona?.nombre ||
                   formValue.proveedor?.persona?.nombre ||
                   "No seleccionado",
        fechaCreacion: new Date(), // Fecha actual para nueva compra
        estado: "EN PLANIFICACIÓN", // Estado inicial para nueva compra
        montoTotal: this.calculateMontoTotal(),
        moneda: formValue.moneda || null,
        plazoCredito: formValue.plazoCredito || 0,
      };
    }

    // Update computed properties for UI (siguiendo regla @no-direct-function-calls-in-template.mdc)
    this.estadoChipColorComputed = this.getEstadoChipColor();
    this.vendedorDisplayTextComputed = this.displayVendedor(formValue.vendedor);
    this.isFormaPagoCreditoComputed = this.isFormaPagoCredito();
    this.step1ButtonDisabledComputed = this.shouldDisableStep1Button();
    this.step1ButtonTextComputed = this.getStep1ButtonText();
    
    // NOTA: updateItemsComputedProperties y updateStep3ComputedProperties 
    // ahora se llaman de forma selectiva solo cuando los datos de items cambian
  }

  private calculateMontoTotal(): number {
    // Calculate total from items
    const items = this.itemsDataSource.data;
    return items.reduce((total, item) => {
      return total + (item.cantidadSolicitada * item.precioUnitarioSolicitado);
    }, 0);
  }

  private calculateMontoTotalEditMode(): number {
    // En modo edición, calcular el monto total de las facturas actuales (notas de recepción)
    // según el manual: "Monto total de las facturas actuales"
    
    console.log('Calculando monto total en modo edición:');
    console.log('- pedidoResumen:', this.pedidoResumen);
    console.log('- pedidoResumen.valorTotal:', this.pedidoResumen?.valorTotal);
    
    // Si tenemos el resumen del backend, usar el valorTotal que representa las facturas actuales
    if (this.pedidoResumen && this.pedidoResumen.valorTotal !== undefined) {
      console.log('- Usando valorTotal del resumen:', this.pedidoResumen.valorTotal);
      return this.pedidoResumen.valorTotal;
    }
    
    // Fallback: calcular desde los ítems del pedido (monto original)
    const items = this.itemsDataSource.data;
    const totalFromItems = items.reduce((sum, item) => {
      return sum + (item.cantidadSolicitada * item.precioUnitarioSolicitado);
    }, 0);
    
    console.log('- Usando cálculo desde ítems:', totalFromItems);
    console.log('- Cantidad de ítems:', items.length);
    
    return totalFromItems;
  }

  private updateStep3ComputedProperties(): void {
    // Update panel izquierdo (ítems pendientes)
    const itemsPendientes = this.itemsPendientesDataSource.data;
    this.itemsPendientesCountComputed = itemsPendientes.length;

    // Update panel derecho (notas de recepción)
    const notasRecepcion = this.notasRecepcionDataSource.data;
    this.notasRecepcionCountComputed = notasRecepcion.length;

    // Update computed flags for buttons
    this.canCreateNotaForItemsComputed = this.selectedItemsPendientes.length > 0;
    this.canAssignItemsToNotaComputed = this.selectedItemsPendientes.length > 0;
    
    // Calcular si se puede finalizar la conciliación
    // Condiciones:
    // 1. Debe haber al menos una nota registrada
    // 2. La etapa debe ser RECEPCION_NOTA con estado EN_PROCESO
    // 3. Debe haber un pedido válido
    let etapaCorrecta = false;
    let estadoCorrecto = false;
    
    // Usar pedidoResumen.etapaActual como fuente principal (más confiable y actualizado)
    // Si no está disponible, usar currentPedido.procesoEtapas como fallback
    if (this.pedidoResumen?.etapaActual) {
      const etapaActual = this.pedidoResumen.etapaActual;
      const tipoEtapa = typeof etapaActual === 'string' ? etapaActual : etapaActual?.tipoEtapa;
      const estadoEtapa = typeof etapaActual === 'object' ? etapaActual?.estadoEtapa : null;
      
      etapaCorrecta = tipoEtapa === ProcesoEtapaTipo.RECEPCION_NOTA;
      estadoCorrecto = estadoEtapa === ProcesoEtapaEstado.EN_PROCESO;
    } else if (this.currentPedido?.procesoEtapas) {
      // Fallback: usar procesoEtapas del pedido cargado
      const etapaRecepcionNota = this.currentPedido.procesoEtapas.find(
        e => e.tipoEtapa === ProcesoEtapaTipo.RECEPCION_NOTA
      );
      etapaCorrecta = !!etapaRecepcionNota;
      estadoCorrecto = etapaRecepcionNota?.estadoEtapa === ProcesoEtapaEstado.EN_PROCESO;
    }
    
    this.canFinalizarConciliacionComputed = 
      this.notasRecepcionCountComputed > 0 && 
      etapaCorrecta && 
      estadoCorrecto &&
      !!this.currentPedido?.id;

    // Update computed properties for each item
    itemsPendientes.forEach((item) => {
      item.isSelectedComputed = this.isItemPendienteSelected(item);
    });

    // Update computed properties for each nota
    notasRecepcion.forEach((nota) => {
      this.calculateNotaComputedProperties(nota);
    });
  }

  private updateItemsComputedProperties(): void {
    const items = this.itemsDataSource.data;
    
    // Update items computed properties

    // Update basic counts from items data
    // Use itemsTotalElements if available (from pagination), otherwise use items.length
    this.itemsCountComputed = this.itemsTotalElements > 0 ? this.itemsTotalElements : items.length;

    // Use backend data for distribution counts if available, otherwise calculate locally
    if (this.pedidoResumen) {
      this.distributedItemsCountComputed = this.pedidoResumen.cantidadItemsConDistribucionCompleta;
      this.pendingDistributionCountComputed = this.pedidoResumen.cantidadItemsPendientesDistribucion;
    } else {
      // Fallback to local calculation if backend data is not available
      this.distributedItemsCountComputed = items.filter((item) => {
        // Check if item has distribuciones property and calculate total
        if (item.distribuciones && Array.isArray(item.distribuciones)) {
          const totalDistribuido = item.distribuciones.reduce((sum, dist) => sum + dist.cantidadAsignada, 0);
          return totalDistribuido === item.cantidadSolicitada;
        }
        return false; // No distributions means not distributed
      }).length;

      this.pendingDistributionCountComputed = this.itemsCountComputed - this.distributedItemsCountComputed;
    }

    // Calcular si se puede finalizar la planificación
    this.canFinalizarPlanificacionComputed = this.canFinalizarPlanificacion();

    // Update computed properties for each item
    items.forEach((item) => {
      this.calculateItemComputedProperties(item);
      // Update selection status for step 3
      if (item.isSelectedComputed !== undefined) {
        item.isSelectedComputed = this.isItemPendienteSelected(item);
      }
    });

    // Items form is always valid for navigation purposes
  }

  private calculateNotaComputedProperties(nota: MockNotaRecepcion): void {
    // Calculate formatted date with robust validation
    if (nota.fecha) {
      try {
        // Asegurar que la fecha sea un objeto Date válido
        const fecha = nota.fecha instanceof Date ? nota.fecha : new Date(nota.fecha);
        nota.fechaFormattedComputed = this.formatDate(fecha);
      } catch (error) {
        console.warn('Error formateando fecha de nota:', error);
        nota.fechaFormattedComputed = 'Fecha inválida';
      }
    } else {
      nota.fechaFormattedComputed = 'Sin fecha';
    }

    // Calculate chip color
    nota.estadoChipColorComputed = this.getEstadoNotaRecepcionChipColor(nota.estado);

    // Calculate display name
    nota.estadoDisplayNameComputed = this.getEstadoNotaRecepcionDisplayName(nota.estado);

    // Calculate selection status
    nota.isSelectedComputed = this.isNotaRecepcionSelected(nota);

    // Calculate monto total de la nota
    nota.montoComputed = this.calculateNotaMonto(nota);
  }

  private calculateNotaMonto(nota: MockNotaRecepcion): number {
    // Usar el valorTotal calculado en el backend
    return nota.valorTotal || 0;
  }

  private getEstadoGeneral(): string {
    const etapas = this.currentPedido?.procesoEtapas;

    if (!etapas || etapas.length === 0) {
      return this.isEditMode ? "CARGANDO..." : "EN PLANIFICACIÓN";
    }

    const etapaSolicitudPago = etapas.find((e) => e.tipoEtapa === ProcesoEtapaTipo.SOLICITUD_PAGO);
    const etapaRecepcionMercaderia = etapas.find((e) => e.tipoEtapa === ProcesoEtapaTipo.RECEPCION_MERCADERIA);
    const etapaRecepcionNota = etapas.find((e) => e.tipoEtapa === ProcesoEtapaTipo.RECEPCION_NOTA);
    const etapaCreacion = etapas.find((e) => e.tipoEtapa === ProcesoEtapaTipo.CREACION);

    if (etapaSolicitudPago?.estadoEtapa === ProcesoEtapaEstado.COMPLETADA) {
      return "CONCLUIDO";
    } else if (etapaRecepcionMercaderia?.estadoEtapa === ProcesoEtapaEstado.EN_PROCESO) {
      return "EN RECEPCIÓN FÍSICA";
    } else if (etapaRecepcionNota?.estadoEtapa === ProcesoEtapaEstado.EN_PROCESO) {
      return "EN RECEPCIÓN NOTAS";
    } else if (etapaCreacion?.estadoEtapa === ProcesoEtapaEstado.COMPLETADA) {
      return "PLANIFICACIÓN FINALIZADA";
    } else if (etapaCreacion?.estadoEtapa === ProcesoEtapaEstado.EN_PROCESO) {
      return "EN PLANIFICACIÓN";
    }
    return "PENDIENTE";
  }

  /**
   * Convierte la etapa actual del resumen del backend a un estado legible
   */
  private getEstadoFromResumen(etapaActual: any): string {
    // Handle both string and object types for backward compatibility
    const tipoEtapa = typeof etapaActual === 'string' ? etapaActual : etapaActual?.tipoEtapa;
    
    switch (tipoEtapa) {
      case 'CREACION':
        return "EN PLANIFICACIÓN";
      case 'RECEPCION_NOTA':
        return "EN RECEPCIÓN NOTAS";
      case 'RECEPCION_MERCADERIA':
        return "EN RECEPCIÓN FÍSICA";
      case 'SOLICITUD_PAGO':
        return "EN SOLICITUD DE PAGO";
      case 'PAGO':
        return "CONCLUIDO";
      default:
        return "PENDIENTE";
    }
  }

  private updateTabStates(etapaActual: ProcesoEtapaTipo | null): void {
    let activeTabIndex = 0;

    console.log("updateTabStates - Parámetros:", {
      etapaActual,
      isEditMode: this.isEditMode,
      pedidoId: this.pedidoId
    });

    // Si es una nueva compra, NO modificar el estado ya configurado
    if (!this.isEditMode || !this.pedidoId) {
      console.log("updateTabStates: Nueva compra detectada - manteniendo estado ya configurado");
      return;
    }

    // Default state para pedidos existentes
    this.datosGeneralesTabState = "editable";
    this.itemsTabState = "disabled";
    this.notasTabState = "disabled";
    this.mercaderiaTabState = "disabled";
    this.pagoTabState = "disabled";

    // Si no hay etapa actual, mantener solo el primer tab habilitado
    if (!etapaActual) {
      console.log("Pedido existente sin etapa definida - solo habilitando tab de Datos Generales");
      this.datosGeneralesTabState = "editable";
      this.selectedTabIndex = 0;
      return;
    }

    // Logic for an existing pedido based on its current stage
    switch (etapaActual) {
      case ProcesoEtapaTipo.CREACION:
        this.datosGeneralesTabState = "editable";
        this.itemsTabState = "editable";
        activeTabIndex = 0; // User works on both tabs
        break;

      case ProcesoEtapaTipo.RECEPCION_NOTA:
        this.datosGeneralesTabState = "readonly";
        this.itemsTabState = "readonly";
        this.notasTabState = "editable";
        activeTabIndex = 2;
        console.log("Navegando a la pestaña de Notas");
        break;

      case ProcesoEtapaTipo.RECEPCION_MERCADERIA:
        this.datosGeneralesTabState = "readonly";
        this.itemsTabState = "readonly";
        this.notasTabState = "readonly";
        this.mercaderiaTabState = "editable";
        activeTabIndex = 3;
        break;

      case ProcesoEtapaTipo.SOLICITUD_PAGO:
        this.datosGeneralesTabState = "readonly";
        this.itemsTabState = "readonly";
        this.notasTabState = "readonly";
        this.mercaderiaTabState = "readonly";
        this.pagoTabState = "editable";
        activeTabIndex = 4;
        break;
    }

    setTimeout(() => {
      this.selectedTabIndex = activeTabIndex;
      this.isTabLoaded = true;
      
      // Cargar los datos del tab inicial automáticamente
      this.loadTabDataIfNeeded(activeTabIndex);
    }, 100);
  }

  // Event handler para cambio de tab
  onTabChange(newIndex: number): void {
    const previousIndex = this.previousTabIndex;
    
    console.log("🔄 onTabChange() ejecutado");
    console.log("  - Tab anterior:", previousIndex);
    console.log("  - Tab nuevo:", newIndex);
    console.log("  - isEditMode:", this.isEditMode);

    // Si es una nueva compra, permitir acceso a tabs 0 y 1
    if (!this.isEditMode && newIndex > 1) {
      console.log("Nueva compra: Solo se puede acceder a los tabs de Datos Generales e Items");
      this.notificacionService.openWarn("En una nueva compra solo se puede acceder a los tabs de Datos Generales e Items");
      // Revertir al tab anterior
      setTimeout(() => {
        this.selectedTabIndex = previousIndex;
      }, 0);
      return;
    }

    // Check if navigating away from the first tab with unsaved changes
    if (previousIndex === 0 && this.datosGeneralesForm.dirty) {
      this.dialogosService.confirm("Cambios sin Guardar", "Hay cambios no guardados en el formulario. ¿Desea descartarlos y continuar?")
        .subscribe((confirmed) => {
          if (confirmed) {
            // User confirmed, proceed with navigation and reset form state
            this.datosGeneralesForm.markAsPristine();
            this.selectedTabIndex = newIndex;
            this.loadTabDataIfNeeded(newIndex);
          } else {
            // User canceled, revert tab selection
            // Use setTimeout to allow the UI to update correctly
            setTimeout(() => {
              this.selectedTabIndex = previousIndex;
              this.previousTabIndex = newIndex;
            }, 0);
          }
        });
    } else {
      // Standard navigation
      this.previousTabIndex = this.selectedTabIndex;
      this.selectedTabIndex = newIndex;
      this.loadTabDataIfNeeded(newIndex);
    }
  }

  /**
   * Carga los datos específicos de cada tab cuando se activa
   */
  private loadTabData(tabIndex: number): void {
    switch (tabIndex) {
      case 0: // Tab 1: Datos Generales
        // Los datos generales ya se cargan en loadInitialData()
        // Solo marcar como cargado para el sistema de lazy loading
        console.log("Tab 0 (Datos Generales) marcado como cargado");
        break;
      case 1: // Tab 2: Ítems del Pedido
        console.log("📋 Cargando Tab 1: Items del Pedido");
        console.log("  - currentPedido?.id:", this.currentPedido?.id);
        if (this.currentPedido?.id) {
          // Pedido existente: cargar ítems del backend
          this.loadItemsData();
          // Cargar el resumen completo cuando se accede al tab de ítems
          this.loadPedidoResumen();
          console.log("  - Datos del tab 1 cargados");
          
          // Cargar productos del proveedor si hay proveedor seleccionado
          if (this.currentPedido?.proveedor?.id) {
            this.loadProductosProveedor();
          }
          
          // Si el estado es EN PLANIFICACION, hacer focus en el botón "Añadir Item"
          if (this.isEstadoEnPlanificacion()) {
            setTimeout(() => {
              this.focusAddItemButton();
            }, 200); // Pequeño delay para asegurar que el tab esté completamente renderizado
          }
        } else {
          // Nueva compra: inicializar tab de ítems vacío
          console.log("  - Nueva compra: Inicializando tab de ítems vacío");
          this.itemsDataSource.data = [];
          this.updateItemsComputedProperties();
          
          // Cargar productos del proveedor si hay proveedor seleccionado en el formulario
          const proveedorId = this.datosGeneralesForm.get("proveedor")?.value?.id;
          if (proveedorId) {
            this.loadProductosProveedor();
          }
          
          // En nueva compra, siempre hacer focus en el botón "Añadir Item"
          setTimeout(() => {
            this.focusAddItemButton();
          }, 200);
        }
        break;
      case 2: // Tab 3: Recepción de Notas
        console.log("📋 Cargando Tab 3: Recepción de Notas");
        console.log("  - currentPedido?.id:", this.currentPedido?.id);
        if (this.currentPedido?.id) {
          // Cargar resumen del pedido para tener la etapa actual actualizada
          this.loadPedidoResumen();
          this.loadItemsPendientesData();
          this.loadNotasRecepcionData();
          console.log("  - Datos del tab 3 cargados");
        } else {
          console.log("  - ❌ No hay currentPedido.id, no se cargan datos");
        }
        break;
      case 3: // Tab 4: Recepción de Mercadería
        // TODO: Cargar datos de recepción de mercadería cuando se implemente
        console.log("Tab 3 (Recepción de Mercadería) marcado como cargado");
        break;
      case 4: // Tab 5: Solicitud de Pago
        // TODO: Cargar datos de solicitud de pago cuando se implemente
        console.log("Tab 4 (Solicitud de Pago) marcado como cargado");
        break;
      // Agregar otros casos según sea necesario
    }
  }

  /**
   * Carga los datos del tab solo si no han sido cargados previamente (lazy loading)
   */
  private loadTabDataIfNeeded(tabIndex: number): void {
    // Si es una nueva compra, permitir acceso al tab 1 (Items) pero no a otros
    if (!this.isEditMode && tabIndex > 1) {
      console.log(`Nueva compra: Tab ${tabIndex} no disponible, solo se puede acceder a tabs 0 y 1`);
      return;
    }

    // Si el tab ya fue cargado, no hacer nada
    if (this.loadedTabs.has(tabIndex)) {
      console.log(`Tab ${tabIndex} ya fue cargado previamente, saltando carga`);
      return;
    }

    // Marcar el tab como cargado antes de cargar los datos
    this.loadedTabs.add(tabIndex);
    console.log(`Cargando datos del tab ${tabIndex} por primera vez`);

    // Cargar los datos específicos del tab
    this.loadTabData(tabIndex);
  }

  /**
   * Fuerza la recarga de un tab específico (útil después de operaciones CRUD)
   */
  private reloadTabData(tabIndex: number): void {
    console.log(`Forzando recarga del tab ${tabIndex}`);
    this.loadTabData(tabIndex);
  }

  /**
   * Marca un tab como no cargado para forzar recarga en próxima visita
   */
  private markTabAsUnloaded(tabIndex: number): void {
    this.loadedTabs.delete(tabIndex);
    console.log(`Tab ${tabIndex} marcado como no cargado`);
  }

  // Step 1: Datos Generales methods
  onBuscarProveedor(): void {
    this.proveedorService.onSearchProveedorPorTexto(this.datosGeneralesForm.get("proveedor")?.value).subscribe((proveedor: Proveedor) => {
      if (proveedor) {
        this.datosGeneralesForm.get("proveedor")?.setValue(proveedor);
        this.selectedProveedorComputed = proveedor;
        this.showProveedorCard = true;
        this.updateComputedProperties();
        // No hacer focus automático, dejar que el usuario use Tab para navegar
      }
    });
  }

  onRemoverProveedor(): void {
    this.datosGeneralesForm.get("proveedor")?.setValue(null);
    this.selectedProveedorComputed = null;
    this.showProveedorCard = false;
    this.updateComputedProperties();
  }

  displayProveedor(proveedor: Proveedor): string {
    return proveedor && proveedor.persona ? proveedor.persona.nombre : "";
  }

  onBuscarVendedor(): void {
    const tableData: TableData[] = [
      { id: "id", nombre: "ID" },
      { id: "persona.nombre", nombre: "Nombre" },
      { id: "persona.documento", nombre: "Documento" },
    ];

    const dialogData: SearchListtDialogData = {
      query: this.vendedorSearchGQL,
      tableData: tableData,
      titulo: "Buscar Vendedor",
      search: true,
      inicialSearch: false,
    };

    this.dialog.open(SearchListDialogComponent, {
      data: dialogData,
      width: "60%",
      height: "80%",
    }).afterClosed().subscribe((vendedor: Vendedor) => {
      if (vendedor) {
        this.datosGeneralesForm.get("vendedor")?.setValue(vendedor);
        this.updateComputedProperties();
        // Navegar al siguiente campo después de seleccionar vendedor
        setTimeout(() => {
          this.focusSucursalEntrega();
        }, 100);
      }
    });
  }

  onFormaPagoChange(): void {
    const formaPago = this.datosGeneralesForm.get("formaPago")?.value;
    if (formaPago && formaPago.descripcion?.toLowerCase().includes("credito")) {
      this.datosGeneralesForm.get("plazoCredito")?.setValidators([Validators.required]);
    } else {
      this.datosGeneralesForm.get("plazoCredito")?.clearValidators();
    }
    this.datosGeneralesForm.get("plazoCredito")?.updateValueAndValidity();
  }

  // Métodos de navegación con teclado
  onProveedorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onBuscarProveedor();
    }
    // Tab navega naturalmente al siguiente campo (Vendedor)
  }

  onVendedorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onBuscarVendedor();
    }
    // Tab navega naturalmente al siguiente campo (Sucursal de entrega)
  }

  onSucursalEntregaClosed(): void {
    // Navegar al siguiente campo después de que se cierre el dropdown
    setTimeout(() => {
      this.focusSucursalInfluencia();
    }, 100);
  }

  onSucursalInfluenciaClosed(): void {
    // Navegar al siguiente campo después de que se cierre el dropdown
    setTimeout(() => {
      this.focusMoneda();
    }, 100);
  }

  onMonedaClosed(): void {
    // Navegar al siguiente campo después de que se cierre el dropdown
    setTimeout(() => {
      this.focusFormaPago();
    }, 100);
  }

  onFormaPagoClosed(): void {
    // Llamar al método existente para actualizar validaciones
    this.onFormaPagoChange();
    // Navegar al siguiente campo después de que se cierre el dropdown
    setTimeout(() => {
      this.focusPlazoCredito();
    }, 100);
  }

  onPlazoCreditoKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      // Validar campo actual antes de navegar
      const plazoControl = this.datosGeneralesForm.get("plazoCredito");
      if (plazoControl && !plazoControl.valid && plazoControl.hasError('required')) {
        plazoControl.markAsTouched();
        this.updateComputedProperties();
        return;
      }
      // Navegar al botón "Guardar y Continuar"
      this.focusContinuarButton();
    }
  }

  // Métodos auxiliares para enfocar campos
  private focusVendedor(): void {
    if (this.vendedorInput) {
      const inputElement = this.vendedorInput.nativeElement?.querySelector('input') || this.vendedorInput.nativeElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  }

  private focusSucursalEntrega(): void {
    if (this.sucursalEntregaSelect) {
      this.sucursalEntregaSelect.focus();
    }
  }

  private focusSucursalInfluencia(): void {
    if (this.sucursalInfluenciaSelect) {
      this.sucursalInfluenciaSelect.focus();
    }
  }

  private focusMoneda(): void {
    if (this.monedaSelect) {
      this.monedaSelect.focus();
    }
  }

  private focusFormaPago(): void {
    if (this.formaPagoSelect) {
      this.formaPagoSelect.focus();
    }
  }

  private focusPlazoCredito(): void {
    if (this.plazoCreditoInput) {
      const inputElement = this.plazoCreditoInput.nativeElement?.querySelector('input') || this.plazoCreditoInput.nativeElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  }

  private focusContinuarButton(): void {
    if (this.continuarButton) {
      this.continuarButton.focus();
    }
  }

  private focusAddItemButton(): void {
    if (this.addItemButton) {
      this.addItemButton.focus();
    }
  }

  /**
   * Verifica si el pedido está en estado "EN PLANIFICACION"
   * Esto ocurre cuando la etapa CREACION está en estado EN_PROCESO
   */
  private isEstadoEnPlanificacion(): boolean {
    // Verificar usando pedidoResumen.etapaActual (más confiable)
    if (this.pedidoResumen?.etapaActual) {
      const etapaActual = this.pedidoResumen.etapaActual;
      const tipoEtapa = typeof etapaActual === 'string' ? etapaActual : etapaActual?.tipoEtapa;
      const estadoEtapa = typeof etapaActual === 'object' ? etapaActual?.estadoEtapa : null;
      
      return tipoEtapa === ProcesoEtapaTipo.CREACION && 
             estadoEtapa === ProcesoEtapaEstado.EN_PROCESO;
    }
    
    // Fallback: verificar usando currentPedido.procesoEtapas
    if (this.currentPedido?.procesoEtapas) {
      const etapaCreacion = this.currentPedido.procesoEtapas.find(
        e => e.tipoEtapa === ProcesoEtapaTipo.CREACION
      );
      return etapaCreacion?.estadoEtapa === ProcesoEtapaEstado.EN_PROCESO;
    }
    
    // Si no hay información de etapas, asumir que no está en planificación
    return false;
  }

  displayVendedor(vendedor: Vendedor): string {
    return vendedor && vendedor.persona ? vendedor.persona.nombre : "";
  }

  displayMoneda(moneda: Moneda): string {
    return moneda ? `${moneda.denominacion} (${moneda.simbolo})` : "";
  }

  displayFormaPago(formaPago: FormaPago): string {
    return formaPago ? formaPago.descripcion : "";
  }

  displaySucursal(sucursal: Sucursal): string {
    return sucursal ? sucursal.nombre : "";
  }

  // Handle form changes - método movido arriba para navegación con teclado

  isFormaPagoCredito(): boolean {
    const formaPago = this.datosGeneralesForm.get("formaPago")?.value;
    return formaPago && formaPago.descripcion === "CREDITO";
  }

  onGuardarDatosGenerales(): void {
    if (this.datosGeneralesForm.valid) {
      console.log("Guardando datos generales:", this.datosGeneralesForm.value);
      // TODO: Implement backend integration

      // Simular la actualización de estado en el pedido actual
      if (this.currentPedido && this.currentPedido.procesoEtapas) {
        const etapaCreacion = this.currentPedido.procesoEtapas.find((e) => e.tipoEtapa === ProcesoEtapaTipo.CREACION);
        if (etapaCreacion) {
          etapaCreacion.estadoEtapa = ProcesoEtapaEstado.COMPLETADA;
        }

        const etapaRecepcionNota = this.currentPedido.procesoEtapas.find((e) => e.tipoEtapa === ProcesoEtapaTipo.RECEPCION_NOTA);
        if (etapaRecepcionNota) {
          etapaRecepcionNota.estadoEtapa = ProcesoEtapaEstado.EN_PROCESO;
        }
      }

      this.updateComputedProperties();
      this.selectedTabIndex = 1; // Navegar a la pestaña de Notas
    }
  }

  // Step 2: Items del Pedido methods
  onAddItem(): void {
    const dialogData: AddEditItemDialogData = {
      pedido: this.currentPedido as Pedido,
      isEdit: false,
      title: "Añadir Nuevo Ítem al Pedido",
    };

    const dialogRef = this.dialog.open(AddEditItemDialogComponent, {
      width: "50%",
      height: "70%",
      data: dialogData,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: AddEditItemDialogResult) => {
      if (result && result.action === "save") {
        console.log("Nuevo ítem añadido:", result.item);
        
        // Marcar tab de ítems como no cargado para recargar en próxima visita
        this.markTabAsUnloaded(1);
        
        // Si estamos en el tab de ítems, recargar inmediatamente
        if (this.selectedTabIndex === 1) {
          // Resetear a primera página y recargar
          this.itemsPageIndex = 0;
          this.loadItemsData();
        } else {
          // Si no estamos en el tab 1, actualizar itemsDataSource localmente si es posible
          // Si estamos en el tab de ítems, recargar inmediatamente con paginación
          if (this.selectedTabIndex === 1) {
            // Resetear a primera página y recargar
            this.itemsPageIndex = 0;
            this.loadItemsData();
          } else {
            // y actualizar propiedades computadas para habilitar botón "Finalizar Planificación"
            // Nota: Esto es una actualización optimista, los datos se recargarán cuando se acceda al tab
            this.updateItemsComputedProperties();
          }
        }
        
        // Marcar tab de recepción de notas como no cargado (puede afectar ítems pendientes)
        this.markTabAsUnloaded(2);
        
        // Recargar resumen del pedido para actualizar header
        if (this.isEditMode) {
          this.loadPedidoResumen();
        }
        
        // Recargar pedido completo para obtener procesoEtapas actualizado
        if (this.currentPedido?.id) {
          this.pedidoService.onGetPedidoById(this.currentPedido.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (pedidoCompleto) => {
                this.currentPedido = pedidoCompleto;
                this.updateComputedProperties();
                // Solo actualizar propiedades computadas si no estamos en el tab 1 (ya se recargó)
                if (this.selectedTabIndex !== 1) {
                  this.updateItemsComputedProperties();
                }
              },
              error: (error) => {
                console.error("Error recargando pedido después de agregar item:", error);
                this.updateComputedProperties();
                if (this.selectedTabIndex !== 1) {
                  this.updateItemsComputedProperties();
                }
              }
            });
        } else {
          this.updateComputedProperties();
        }
      }
    });
  }

  onEditItem(item: PedidoItem, index: number): void {
    const dialogData: AddEditItemDialogData = {
      pedido: this.currentPedido as Pedido,
      item: item,
      isEdit: true,
      title: "Editar Ítem del Pedido",
    };

    const dialogRef = this.dialog.open(AddEditItemDialogComponent, {
      width: "70%",
      height: "70%",
      data: dialogData,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: AddEditItemDialogResult) => {
      if (result && result.action === "save") {
        console.log("Ítem actualizado:", result.item);
        
        // Marcar tab de ítems como no cargado para recargar en próxima visita
        this.markTabAsUnloaded(1);
        
        // Si estamos en el tab de ítems, recargar inmediatamente
        if (this.selectedTabIndex === 1) {
          // Resetear a primera página y recargar
          this.itemsPageIndex = 0;
          this.loadItemsData();
        } else {
          // Si no estamos en el tab 1, actualizar propiedades computadas para habilitar botón
          this.updateItemsComputedProperties();
        }
        
        // Marcar tab de recepción de notas como no cargado (puede afectar ítems pendientes)
        this.markTabAsUnloaded(2);
        
        // Recargar resumen del pedido para actualizar header
        if (this.isEditMode) {
          this.loadPedidoResumen();
        }
        
        // Actualizar propiedades computadas
        this.updateComputedProperties();
      }
    });
  }

  onDistributeItem(item: PedidoItem, index: number): void {
    if (!this.currentPedido) {
      this.notificacionService.openAlgoSalioMal("No hay pedido seleccionado");
      return;
    }

    // Extraer sucursales del pedido usando las propiedades correctas
    const sucursalesEntrega = this.currentPedido.sucursalEntregaList?.map(se => se.sucursal) || [];
    const sucursalesInfluencia = this.currentPedido.sucursalInfluenciaList?.map(si => si.sucursal) || [];

    if (sucursalesEntrega.length === 0 || sucursalesInfluencia.length === 0) {
      this.notificacionService.openAlgoSalioMal("El pedido debe tener sucursales de entrega e influencia configuradas");
      return;
    }

    // Cargar distribuciones existentes del backend
    this.pedidoService.onGetPedidoItemDistribucionesByPedidoItemId(item.id).subscribe({
      next: (distribuciones) => {
        console.log('Distribuciones cargadas:', distribuciones);
        
        const dialogData: DistributeItemDialogData = {
          item: item,
          distribuciones: distribuciones,
          sucursalesInfluencia: sucursalesInfluencia,
          sucursalesEntrega: sucursalesEntrega,
          title: `Distribuir: ${item.producto.descripcion}`
        };

        const dialogRef = this.dialog.open(DistributeItemDialogComponent, {
          width: '80%',
          height: '70%',
          data: dialogData,
          disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result?.success) {
            // Solo recargar datos si la operación fue exitosa
            // Marcar tab de ítems como no cargado para recargar en próxima visita
            this.markTabAsUnloaded(1);
            
            // Si estamos en el tab de ítems, recargar inmediatamente
            if (this.selectedTabIndex === 1) {
              // Resetear a primera página y recargar
          this.itemsPageIndex = 0;
          this.loadItemsData();
            } else {
              // Si no estamos en el tab 1, actualizar propiedades computadas
              this.updateItemsComputedProperties();
            }
            
            // Marcar tab de recepción de notas como no cargado (puede afectar ítems pendientes)
            this.markTabAsUnloaded(2);
            
            // Recargar resumen del pedido para actualizar header
            if (this.isEditMode) {
              this.loadPedidoResumen();
            }
            this.updateComputedProperties();
          }
        });
      },
      error: (error) => {
        console.error("Error cargando distribuciones:", error);
        // Usar array vacío como fallback
        const distribuciones: PedidoItemDistribucion[] = [];
        
        const dialogData: DistributeItemDialogData = {
          item: item,
          distribuciones: distribuciones,
          sucursalesInfluencia: sucursalesInfluencia,
          sucursalesEntrega: sucursalesEntrega,
          title: `Distribuir: ${item.producto.descripcion}`
        };

        const dialogRef = this.dialog.open(DistributeItemDialogComponent, {
          width: '80%',
          height: '70%',
          data: dialogData,
          disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result?.success) {
            // Solo recargar datos si la operación fue exitosa
            // Marcar tab de ítems como no cargado para recargar en próxima visita
            this.markTabAsUnloaded(1);
            
            // Si estamos en el tab de ítems, recargar inmediatamente
            if (this.selectedTabIndex === 1) {
              // Resetear a primera página y recargar
          this.itemsPageIndex = 0;
          this.loadItemsData();
            } else {
              // Si no estamos en el tab 1, actualizar propiedades computadas
              this.updateItemsComputedProperties();
            }
            
            // Marcar tab de recepción de notas como no cargado (puede afectar ítems pendientes)
            this.markTabAsUnloaded(2);
            
            // Recargar resumen del pedido para actualizar header
            if (this.isEditMode) {
              this.loadPedidoResumen();
            }
            this.updateComputedProperties();
          }
        });
      }
    });
  }

  onDeleteItem(item: PedidoItem, index: number): void {
    this.dialogosService.confirm(
      'Eliminar Ítem',
      `¿Está seguro de que desea eliminar el ítem "${item.producto.descripcion}"?`
    ).subscribe(confirmed => {
      if (confirmed) {
        this.pedidoService.onDeletePedidoItem(item.id).subscribe({
          next: (result) => {
            if (result) {
              console.log("Ítem eliminado exitosamente");
              this.notificacionService.openSucess("Ítem eliminado exitosamente");
              
              // Marcar tab de ítems como no cargado para recargar en próxima visita
              this.markTabAsUnloaded(1);
              
              // Si estamos en el tab de ítems, recargar inmediatamente
              if (this.selectedTabIndex === 1) {
                // Resetear a primera página y recargar
                this.itemsPageIndex = 0;
                this.loadItemsData();
              } else {
                // Si no estamos en el tab 1, actualizar propiedades computadas para deshabilitar botón si no hay items
                this.updateItemsComputedProperties();
              }
              
              // Marcar tab de recepción de notas como no cargado (puede afectar ítems pendientes)
              this.markTabAsUnloaded(2);
              
              // Recargar resumen del pedido para actualizar header
              if (this.isEditMode) {
                this.loadPedidoResumen();
              }
              
              // Actualizar propiedades computadas
              this.updateComputedProperties();
            }
          },
          error: (error) => {
            console.error("Error eliminando ítem:", error);
            this.notificacionService.openAlgoSalioMal("Error al eliminar el ítem");
          }
        });
      }
    });
  }

  /**
   * Carga los datos de los ítems del pedido desde el backend con paginación
   */
  private loadItemsData(): void {
    if (!this.currentPedido?.id) {
      return;
    }

    this.itemsLoading = true;

    console.log("📦 loadItemsData() ejecutado");
    console.log("  - currentPedido.id:", this.currentPedido.id);
    console.log("  - pageIndex:", this.itemsPageIndex);
    console.log("  - pageSize:", this.itemsPageSize);
    console.log("  - searchText:", this.itemsSearchText);

    this.pedidoService
      .onGetPedidoItemPorPedidoPage(
        this.currentPedido.id,
        this.itemsPageIndex,
        this.itemsPageSize,
        this.itemsSearchText || undefined
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log("📦 Ítems cargados del backend:", response);
          console.log("  - Cantidad de ítems:", response.getContent?.length || 0);
          
          // Procesar los ítems y añadir propiedades computadas
          const processedItems = (response.getContent || []).map((item: PedidoItem) => 
            this.processItemForDisplay(item)
          );
          
          // Actualizar la tabla
          this.itemsDataSource.data = processedItems;
          this.itemsTotalElements = response.getTotalElements || 0;
          this.itemsLoading = false;
          
          console.log("📦 Llamando a updateItemsComputedProperties()");
          // Actualizar propiedades computadas
          this.updateItemsComputedProperties();
        },
        error: (error) => {
          console.error("Error cargando ítems:", error);
          this.notificacionService.openAlgoSalioMal("Error al cargar los ítems del pedido");
          this.itemsLoading = false;
        }
      });
  }

  /**
   * Carga los ítems pendientes de conciliar para el Tab 3
   * Solo muestra ítems con cantidad pendiente > 0
   */
  private loadItemsPendientesData(): void {
    if (!this.currentPedido?.id) return;

    this.itemsPendientesLoading = true;

    this.pedidoService
      .onGetPedidoItemPorPedidoPage(
        this.currentPedido.id,
        this.itemsPendientesPageIndex,
        this.itemsPendientesPageSize,
        this.itemsPendientesSearchText
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log("Ítems pendientes cargados:", response);
          
          // Filtrar solo ítems con cantidad pendiente > 0
          const items = (response.getContent || []).filter((item: PedidoItem) => {
            // Usar el campo cantidadPendiente calculado en el backend
            return (item.cantidadPendiente || 0) > 0;
          });

          // Procesar ítems para mostrar
          const processedItems = items.map((item: PedidoItem) => {
            const mockItem = this.processItemForDisplay(item) as MockPedidoItem;
            
            // Usar la cantidad pendiente calculada en el backend
            mockItem.cantidadPendienteComputed = item.cantidadPendiente || 0;
            
            // Calcular estado de distribución
            mockItem.distributionStatusTextComputed = item.distribucionConcluida 
              ? "Completa" 
              : "Pendiente";
            mockItem.distributionStatusClassComputed = item.distribucionConcluida 
              ? "estado-activo" 
              : "estado-pendiente";
            
            return mockItem;
          });

          this.itemsPendientesDataSource.data = processedItems;
          this.itemsPendientesTotalElements = response.getTotalElements || 0;
          this.itemsPendientesLoading = false;
          
          this.updateStep3ComputedProperties();
        },
        error: (error) => {
          console.error("Error cargando ítems pendientes:", error);
          this.notificacionService.openAlgoSalioMal(
            "Error al cargar los ítems pendientes de conciliar"
          );
          this.itemsPendientesLoading = false;
        },
      });
  }

  /**
   * Carga las notas de recepción del pedido para el Tab 3
   * Incluye tanto notas normales como notas de rechazo
   */
  private loadNotasRecepcionData(): void {
    if (!this.currentPedido?.id) return;

    console.log("📄 loadNotasRecepcionData() ejecutado");
    console.log("  - currentPedido.id:", this.currentPedido.id);
    
    this.notasRecepcionLoading = true;

    this.pedidoService
      .onGetNotaRecepcionPorPedidoIdAndNumeroPage(
        this.currentPedido.id,
        this.notasRecepcionSearchText ? parseInt(this.notasRecepcionSearchText) : null,
        this.notasRecepcionPageIndex,
        this.notasRecepcionPageSize
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log("📄 Notas de recepción cargadas del backend:", response);
          console.log("  - response.getContent:", response.getContent);
          console.log("  - Cantidad de notas:", response.getContent?.length || 0);
          
          // Procesar notas para mostrar (incluye notas normales y de rechazo)
          const processedNotas = (response.getContent || []).map((nota: NotaRecepcion) => {
            const mockNota = this.processNotaForDisplay(nota) as MockNotaRecepcion;
            return mockNota;
          });

          console.log("📄 Notas procesadas para UI:", processedNotas);
          console.log("  - Cantidad de notas procesadas:", processedNotas.length);
          
          this.notasRecepcionDataSource.data = processedNotas;
          this.notasRecepcionTotalElements = response.getTotalElements || 0;
          this.notasRecepcionLoading = false;
          
          console.log("📄 Llamando a updateStep3ComputedProperties()");
          this.updateStep3ComputedProperties();
        },
        error: (error) => {
          console.error("Error cargando notas de recepción:", error);
          this.notificacionService.openAlgoSalioMal(
            "Error al cargar las notas de recepción"
          );
          this.notasRecepcionLoading = false;
        },
      });
  }

  /**
   * Procesa un ítem del pedido para añadir propiedades computadas necesarias para la UI
   */
  private processItemForDisplay(item: PedidoItem): MockPedidoItem {
    const processedItem: MockPedidoItem = {
      ...item,
      // Añadir propiedades computadas necesarias para la UI
      subtotalComputed: (item.cantidadSolicitada || 0) * (item.precioUnitarioSolicitado || 0),
      distributionStatusTextComputed: item.distribucionConcluida ? "Concluida" : "Pendiente", 
      distributionStatusClassComputed: item.distribucionConcluida ? "estado-activo" : "estado-pendiente",
      isSelectedComputed: false,
      distribuciones: []
    } as any;

    return processedItem;
  }

  /**
   * Procesa una nota de recepción para añadir propiedades computadas necesarias para la UI
   */
  private processNotaForDisplay(nota: NotaRecepcion): MockNotaRecepcion {
    const isNotaRechazo = this.isNotaRechazo(nota);

    const processedNota: MockNotaRecepcion = {
      ...nota,
      // Añadir propiedades computadas necesarias para la UI
      fechaFormattedComputed: nota.fecha ? this.formatDate(new Date(nota.fecha)) : '',
      estadoChipColorComputed: isNotaRechazo ? 'warn' : this.getEstadoNotaRecepcionChipColor(nota.estado),
      estadoDisplayNameComputed: isNotaRechazo ? 'Nota de Rechazo' : this.getEstadoNotaRecepcionDisplayName(nota.estado),
      isSelectedComputed: false,
      // Propiedades específicas para notas de rechazo
      isNotaRechazoComputed: isNotaRechazo,
      // Propiedad para el monto total de la nota
      montoComputed: nota.valorTotal || 0,
    } as any;

    return processedNota;
  }

  onFinalizarPlanificacion(): void {
    console.log("🚀 onFinalizarPlanificacion() ejecutado");
    console.log("  - currentPedido?.id:", this.currentPedido?.id);
    console.log("  - canFinalizarPlanificacionComputed:", this.canFinalizarPlanificacionComputed);
    
    if (!this.currentPedido?.id) {
      this.notificacionService.openAlgoSalioMal("No hay pedido seleccionado");
      return;
    }

    // Validar que hay ítems en el pedido
    if (this.itemsDataSource.data.length === 0) {
      this.notificacionService.openAlgoSalioMal("Debe agregar al menos un ítem al pedido antes de finalizar la planificación");
      return;
    }

    // Mostrar confirmación
    this.dialogosService.confirm(
      "Finalizar Planificación",
      "¿Está seguro de que desea finalizar la planificación del pedido? Esta acción no se puede deshacer."
    ).subscribe(confirmed => {
      if (confirmed) {
        // Llamar al backend para finalizar la creación
        this.pedidoService.onFinalizarCreacionPedido(this.currentPedido.id).subscribe({
          next: (pedidoActualizado) => {
            console.log("Planificación finalizada exitosamente:", pedidoActualizado);
            this.currentPedido = pedidoActualizado;
            
            // Recargar resumen del pedido para actualizar header
            this.loadPedidoResumen();
            
            // Actualizar propiedades computadas
            this.updateComputedProperties();
            
            // Mostrar mensaje de éxito
            this.notificacionService.openSucess("Planificación finalizada exitosamente. El pedido ha avanzado a la etapa de Recepción de Notas.");
            
            // Navegar a la pestaña de Recepción de Notas
            this.selectedTabIndex = 2;
          },
          error: (error) => {
            console.error("Error finalizando planificación:", error);
            this.notificacionService.openAlgoSalioMal("Error al finalizar la planificación del pedido");
          }
        });
      }
    });
  }

  // === STEP 3: RECEPCIÓN DE NOTAS METHODS (Según Manual) ===

  // Panel Izquierdo: Gestión de selección de ítems pendientes
  onToggleItemPendiente(item: MockPedidoItem, isSelected: boolean): void {
    if (isSelected) {
      if (!this.selectedItemsPendientes.includes(item)) {
        this.selectedItemsPendientes.push(item);
      }
    } else {
      const index = this.selectedItemsPendientes.indexOf(item);
      if (index > -1) {
        this.selectedItemsPendientes.splice(index, 1);
      }
    }
    this.updateStep3ComputedProperties();
  }

  onToggleAllItemsPendientes(isSelected: boolean): void {
    if (isSelected) {
      this.selectedItemsPendientes = [...this.itemsPendientesDataSource.data];
    } else {
      this.selectedItemsPendientes = [];
    }
    this.updateStep3ComputedProperties();
  }

  isItemPendienteSelected(item: MockPedidoItem): boolean {
    return this.selectedItemsPendientes.includes(item);
  }

  // Panel Derecho: Gestión de selección de notas de recepción
  onSelectNotaRecepcion(nota: MockNotaRecepcion): void {
    this.selectedNotaRecepcion = nota;
    this.updateStep3ComputedProperties();
  }

  isNotaRecepcionSelected(nota: MockNotaRecepcion): boolean {
    return this.selectedNotaRecepcion === nota;
  }

  // Métodos para paginación y búsqueda de ítems del pedido
  onItemsPageChange(event: PageEvent): void {
    this.itemsPageIndex = event.pageIndex;
    this.itemsPageSize = event.pageSize;
    this.loadItemsData();
  }

  onItemsSearchChange(searchText: string): void {
    this.itemsSearchText = searchText;
    this.itemsPageIndex = 0; // Reset to first page
    this.loadItemsData();
  }

  onToggleItemsSearch(): void {
    this.showItemsSearch = !this.showItemsSearch;
    if (!this.showItemsSearch) {
      // Si se oculta el buscador, limpiar el texto de búsqueda y recargar
      this.itemsSearchText = '';
      this.itemsPageIndex = 0;
      this.loadItemsData();
    }
  }

  // Métodos para paginación y búsqueda de ítems pendientes
  onItemsPendientesPageChange(event: any): void {
    this.itemsPendientesPageIndex = event.pageIndex;
    this.itemsPendientesPageSize = event.pageSize;
    this.loadItemsPendientesData();
  }

  onItemsPendientesSearchChange(searchText: string): void {
    this.itemsPendientesSearchText = searchText;
    this.itemsPendientesPageIndex = 0; // Reset to first page
    this.loadItemsPendientesData();
  }

  // Métodos para paginación y búsqueda de notas de recepción
  onNotasRecepcionPageChange(event: any): void {
    this.notasRecepcionPageIndex = event.pageIndex;
    this.notasRecepcionPageSize = event.pageSize;
    this.loadNotasRecepcionData();
  }

  onNotasRecepcionSearchChange(searchText: string): void {
    this.notasRecepcionSearchText = searchText;
    this.notasRecepcionPageIndex = 0; // Reset to first page
    this.loadNotasRecepcionData();
  }

  // Botones de acción según manual
  onCrearNuevaNotaParaItems(): void {
    if (this.selectedItemsPendientes.length === 0) return;

    const dialogData: AddEditNotaRecepcionDialogData = {
      pedido: this.currentPedido as Pedido,
      isEdit: false,
      selectedItemsToAssign: this.selectedItemsPendientes, // Pasar ítems seleccionados
      autoAssignItems: true // Habilitar asignación automática
    };

    const dialogRef = this.dialog.open(AddEditNotaRecepcionDialogComponent, {
      width: "80%",
      height: "80%",
      data: dialogData,
      disableClose: true,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((result: AddEditNotaRecepcionDialogResult) => {
      if (result && result.changesMade) {
        console.log("Nueva nota creada con ítems asignados:", result);

        // Limpiar selección de ítems
        this.selectedItemsPendientes = [];

        // Recargar datos reales del backend
        this.markTabAsUnloaded(2);
        this.reloadTabData(2);

        this.updateComputedProperties();
        
        // Mostrar notificación si hay mensaje
        if (result.message) {
          this.notificacionService.openSucess(result.message);
        } else {
          this.notificacionService.openSucess("Nota de recepción creada exitosamente");
        }
      } else if (result) {
        console.log("Diálogo cerrado sin cambios:", result);
      }
    });
  }

  onCrearNuevaNota(): void {
    const dialogData: AddEditNotaRecepcionDialogData = {
      pedido: this.currentPedido as Pedido,
      isEdit: false,
    };

    const dialogRef = this.dialog.open(AddEditNotaRecepcionDialogComponent, {
      width: "80%",
      height: "80%",
      data: dialogData,
      disableClose: true,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((result: AddEditNotaRecepcionDialogResult) => {
      if (result && result.changesMade) {
        console.log("Nueva nota creada:", result);

        // Recargar datos reales del backend
        this.markTabAsUnloaded(2);
        this.reloadTabData(2);

        this.updateComputedProperties();
        
        // Mostrar notificación si hay mensaje
        if (result.message) {
          this.notificacionService.openSucess(result.message);
        } else {
          this.notificacionService.openSucess("Nota de recepción creada exitosamente");
        }
      } else if (result) {
        console.log("Diálogo cerrado sin cambios:", result);
      }
    });
  }

  onAsignarItemsALaNota(nota: NotaRecepcion): void {
    if (this.selectedItemsPendientes.length === 0) return;

    // Asignar ítems a la nota especificada
    this.asignarItemsANota(nota);

    console.log("Ítems asignados a la nota:", nota.numero);
    this.updateComputedProperties();
  }

  private asignarItemsANota(nota: NotaRecepcion): void {
    if (this.selectedItemsPendientes.length === 0) return;

    const pedidoItemIds = this.selectedItemsPendientes.map(item => item.id);

    this.pedidoService.onAsignarItemsANota(nota.id, pedidoItemIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            // Limpiar selección
            this.selectedItemsPendientes = [];
            
            // Recargar datos para reflejar los cambios
            // Tab 2: Recepción Documental (items pendientes y notas)
            this.markTabAsUnloaded(2);
            this.reloadTabData(2);
            
            this.updateComputedProperties();
            
            // Mostrar mensaje apropiado basado en si hay errores
            if (result.errores && result.errores.length > 0) {
              // Algunos ítems se asignaron, otros no
              const errores = result.errores.map(e => `Ítem ${e.pedidoItemId}: ${e.error}`).join('\n');
              this.notificacionService.openWarn(`${result.message}\n\nErrores:\n${errores}`);
            } else {
              // Todos los ítems se asignaron exitosamente
              this.notificacionService.openSucess(result.message);
            }
          } else {
            // Fallo completo
            this.notificacionService.openAlgoSalioMal(result.message);
            
            // Mostrar errores específicos si los hay
            if (result.errores && result.errores.length > 0) {
              const errores = result.errores.map(e => `Ítem ${e.pedidoItemId}: ${e.error}`).join('\n');
              this.notificacionService.openAlgoSalioMal(`Errores en la asignación:\n${errores}`);
            }
          }
        },
        error: (error) => {
          console.error('Error al asignar ítems a la nota:', error);
          this.notificacionService.openAlgoSalioMal("Error al asignar ítems a la nota");
        }
      });
  }

  // CRUD de notas de recepción
  onEditNotaRecepcion(nota: MockNotaRecepcion, index: number): void {
    const dialogData: AddEditNotaRecepcionDialogData = {
      pedido: this.currentPedido as Pedido,
      nota: nota,
      isEdit: true,
    };

    const dialogRef = this.dialog.open(AddEditNotaRecepcionDialogComponent, {
      width: "80%",
      height: "80%",
      data: dialogData,
      disableClose: true,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((result: AddEditNotaRecepcionDialogResult) => {
      if (result && result.changesMade) {
        console.log("Cambios detectados en nota de recepción:", result);

        // Recargar datos reales del backend
        this.markTabAsUnloaded(2);
        this.reloadTabData(2);

        // Actualizar propiedades computadas incluyendo el monto total
        this.updateComputedProperties();
        
        // Mostrar notificación si hay mensaje
        if (result.message) {
          this.notificacionService.openSucess(result.message);
        }
      } else if (result) {
        console.log("Diálogo cerrado sin cambios:", result);
      }
    });
  }

  onGestionarItemsDeLaNota(nota: NotaRecepcion): void {
    // TODO: Implementar diálogo para gestionar ítems de la nota
    console.log("Gestionar ítems de la nota:", nota.numero);
  }

  onDividirItem(item: MockPedidoItem): void {
    if (!item.cantidadPendienteComputed || item.cantidadPendienteComputed <= 0) {
      this.notificacionService.openAlgoSalioMal('No hay cantidad pendiente para dividir');
      return;
    }

    const dialogData: DividirItemDialogData = {
      pedidoItem: item,
      notaRecepcion: this.selectedNotaRecepcion || undefined,
      notasDisponibles: this.notasRecepcionDataSource.data,
      pedidoId: this.pedidoId || 0
    };

    const dialogRef = this.dialog.open(DividirItemDialogComponent, {
      data: dialogData,
      width: '50%',
      height: '60%',
    });

    dialogRef.afterClosed().subscribe((result: DividirItemDialogResult) => {
      if (result?.success) {
        this.notificacionService.openSucess(result.message || 'Ítem dividido exitosamente');
        
        // Recargar datos del tab 3
        this.markTabAsUnloaded(2);
        this.loadTabDataIfNeeded(2);
      }
    });
  }

  onRechazarItem(item: MockPedidoItem): void {
    if (!item.cantidadPendienteComputed || item.cantidadPendienteComputed <= 0) {
      this.notificacionService.openAlgoSalioMal('No hay cantidad pendiente para rechazar');
      return;
    }

    const dialogData: RechazarItemDialogData = {
      pedidoItem: item,
      notasDisponibles: this.notasRecepcionDataSource.data,
      pedidoId: this.pedidoId || 0
    };

    const dialogRef = this.dialog.open(RechazarItemDialogComponent, {
      data: dialogData,
      width: '50%',
      height: '70%',
    });

    dialogRef.afterClosed().subscribe((result: RechazarItemDialogResult) => {
      if (result?.success) {
        this.notificacionService.openSucess(result.message || 'Ítem rechazado exitosamente');
        
        // Recargar datos del tab 3
        this.markTabAsUnloaded(2);
        this.loadTabDataIfNeeded(2);
      }
    });
  }

  onDeleteNotaRecepcion(index: number): void {
    const nota = this.notasRecepcionDataSource.data[index];

    // Usar DialogosService para confirmación (patrón estándar del proyecto)
    this.dialogosService.confirm(
      'Eliminar Nota de Recepción',
      `¿Está seguro de eliminar la nota ${nota.numero}?`
    ).subscribe(confirmed => {
      if (confirmed) {
        // Llamar servicio real para eliminar
        this.pedidoService.onDeleteNotaRecepcion(nota.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (success) => {
              if (success) {
                // Si era la nota seleccionada, limpiar selección
                if (this.selectedNotaRecepcion === nota) {
                  this.selectedNotaRecepcion = null;
                }

                // Recargar datos reales del backend
                this.markTabAsUnloaded(2);
                this.reloadTabData(2);

                this.updateComputedProperties();
                this.notificacionService.openSucess("Nota de recepción eliminada exitosamente");
              } else {
                this.notificacionService.openAlgoSalioMal("Error al eliminar la nota de recepción");
              }
            },
            error: (error) => {
              console.error('Error al eliminar nota de recepción:', error);
              this.notificacionService.openAlgoSalioMal("Error al eliminar la nota de recepción");
            }
          });
      }
    });
  }

  onFinalizarConciliacion(): void {
    console.log("🚀 onFinalizarConciliacion() ejecutado");
    console.log("  - currentPedido?.id:", this.currentPedido?.id);
    console.log("  - canFinalizarConciliacionComputed:", this.canFinalizarConciliacionComputed);
    
    if (!this.currentPedido?.id) {
      this.notificacionService.openAlgoSalioMal("No hay pedido seleccionado");
      return;
    }

    // Validaciones según manual:
    // 1. Se verifica que existan notas registradas
    if (this.notasRecepcionCountComputed === 0) {
      this.notificacionService.openAlgoSalioMal("Debe registrar al menos una nota de recepción para finalizar la conciliación.");
      return;
    }

    // 2. Validar que la etapa actual sea RECEPCION_NOTA con estado EN_PROCESO
    if (this.currentPedido.procesoEtapas) {
      const etapaRecepcionNota = this.currentPedido.procesoEtapas.find(
        e => e.tipoEtapa === ProcesoEtapaTipo.RECEPCION_NOTA
      );
      
      if (!etapaRecepcionNota) {
        this.notificacionService.openAlgoSalioMal("El pedido no está en la etapa de Recepción de Notas.");
        return;
      }
      
      if (etapaRecepcionNota.estadoEtapa !== ProcesoEtapaEstado.EN_PROCESO) {
        this.notificacionService.openAlgoSalioMal("La etapa de Recepción de Notas no está en proceso. No se puede finalizar la conciliación.");
        return;
      }
    }

    // Mostrar confirmación
    this.dialogosService.confirm(
      "Finalizar Conciliación Documental",
      "¿Está seguro de que desea finalizar la conciliación documental? Esta acción no se puede deshacer."
    ).subscribe(confirmed => {
      if (confirmed) {
        // Llamar al backend para finalizar la recepción de notas
        this.pedidoService.onFinalizarRecepcionNotas(this.currentPedido.id).subscribe({
          next: (pedidoActualizado) => {
            console.log("Conciliación documental finalizada exitosamente:", pedidoActualizado);
            this.currentPedido = pedidoActualizado;
            
            // Recargar resumen del pedido para actualizar header
            this.loadPedidoResumen();
            
            // Actualizar propiedades computadas
            this.updateComputedProperties();
            
            // Actualizar estados de tabs basado en la nueva etapa
            this.updateTabStates(ProcesoEtapaTipo.RECEPCION_MERCADERIA);
            
            // Mostrar mensaje de éxito
            this.notificacionService.openSucess("Conciliación documental finalizada exitosamente. El pedido ha avanzado a la etapa de Recepción de Mercadería.");
            
            // Navegar a la pestaña de Recepción de Mercadería
            this.selectedTabIndex = 3;
          },
          error: (error) => {
            console.error("Error finalizando conciliación documental:", error);
            this.notificacionService.openAlgoSalioMal("Error al finalizar la conciliación documental: " + (error.message || "Error desconocido"));
          }
        });
      }
    });
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date): string {
    // Validar que la fecha sea válida antes de formatearla
    if (!date || isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    return new Intl.DateTimeFormat("es-PY").format(date);
  }

  /**
   * Formatea un número con separador de miles y decimales solo si existen
   * Formato: '1.0-2' (máximo 2 decimales, solo muestra si existen)
   */
  formatNumber(value: number | string | null | undefined): string {
    if (value === null || value === undefined) {
      return '0';
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return '0';
    }
    
    // Usar Intl.NumberFormat para formatear con separador de miles
    // minimumFractionDigits: 0 (no mostrar decimales si no existen)
    // maximumFractionDigits: 2 (máximo 2 decimales)
    return new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numValue);
  }

  getEstadoChipColor(): string {
    const estado = this.headerDataComputed.estado;

    switch (estado) {
      case "CONCLUIDO":
        return "accent"; // Green
      case "EN PLANIFICACIÓN":
      case "EN RECEPCIÓN NOTAS":
      case "EN RECEPCIÓN FÍSICA":
        return "primary"; // Orange/Blue
      default:
        return "warn"; // Red for any error states
    }
  }

  getEstadoNotaRecepcionChipColor(estado: NotaRecepcionEstado): string {
    switch (estado) {
      case NotaRecepcionEstado.CONCILIADA:
      case NotaRecepcionEstado.RECEPCION_COMPLETA:
      case NotaRecepcionEstado.CERRADA:
        return "accent"; // Green
      case NotaRecepcionEstado.EN_RECEPCION:
      case NotaRecepcionEstado.RECEPCION_PARCIAL:
        return "accent"; // Green para notas normales
      case NotaRecepcionEstado.PENDIENTE_CONCILIACION:
        return "accent"; // Green para notas normales
      default:
        return "accent"; // Green por defecto
    }
  }

  getEstadoNotaRecepcionDisplayName(estado: NotaRecepcionEstado): string {
    switch (estado) {
      case NotaRecepcionEstado.PENDIENTE_CONCILIACION:
        return "Pendiente Conciliación";
      case NotaRecepcionEstado.CONCILIADA:
        return "Conciliada";
      case NotaRecepcionEstado.EN_RECEPCION:
        return "En Recepción";
      case NotaRecepcionEstado.RECEPCION_PARCIAL:
        return "Recepción Parcial";
      case NotaRecepcionEstado.RECEPCION_COMPLETA:
        return "Recepción Completa";
      case NotaRecepcionEstado.CERRADA:
        return "Cerrada";
      default:
        return estado;
    }
  }

  /**
   * Determina si una nota es de rechazo basándose en múltiples indicadores
   */
  isNotaRechazo(nota: NotaRecepcion): boolean {
    return nota.esNotaRechazo || 
           nota.tipoBoleta === 'RECHAZO_NO_ENTREGADO' ||
           !nota.numero; // Notas sin número suelen ser de rechazo
  }



  // Método para verificar si se puede navegar a un paso específico
  canNavigateToStep(stepIndex: number): boolean {
    if (!this.isEditMode) {
      // Para nueva compra, permitir acceso a tabs 0 (Datos Generales) y 1 (Items)
      return stepIndex === 0 || stepIndex === 1;
    }

    // En modo edición, permitir navegar a cualquier paso que no esté deshabilitado
    switch (stepIndex) {
      case 0: return this.datosGeneralesTabState !== "disabled";
      case 1: return this.itemsTabState !== "disabled";
      case 2: return this.notasTabState !== "disabled";
      case 3: return this.mercaderiaTabState !== "disabled";
      case 4: return this.pagoTabState !== "disabled";
      default: return false;
    }
  }

  /**
   * Maneja el evento cuando se finaliza la recepción física
   */
  onRecepcionFinalizada(): void {
    console.log('Recepción física finalizada - Actualizando estados...');
    
    // 1. Recargar datos del pedido para obtener el estado actualizado
    this.loadPedidoResumen();
    
    // 2. Actualizar header con nuevos datos
    this.updateHeaderData();
    
    // 3. Actualizar propiedades computadas
    this.updateComputedProperties();
    
    // 4. Verificar si la etapa RECEPCION_MERCADERIA está completada
    // Solo navegar automáticamente si todas las recepciones están finalizadas
    setTimeout(() => {
      // Verificar estado de la etapa después de recargar datos
      if (this.pedidoResumen?.etapaActual) {
        const etapaActual = this.pedidoResumen.etapaActual;
        const tipoEtapa = typeof etapaActual === 'string' ? etapaActual : etapaActual?.tipoEtapa;
        const estadoEtapa = typeof etapaActual === 'object' ? etapaActual?.estadoEtapa : null;
        
        // Si la etapa RECEPCION_MERCADERIA está completada, navegar a Solicitud de Pago
        if (tipoEtapa === ProcesoEtapaTipo.SOLICITUD_PAGO || 
            (tipoEtapa === ProcesoEtapaTipo.RECEPCION_MERCADERIA && estadoEtapa === ProcesoEtapaEstado.COMPLETADA)) {
          // Actualizar estados de tabs
          this.updateTabStates(ProcesoEtapaTipo.SOLICITUD_PAGO);
          
          // Navegar automáticamente al tab de Solicitud de Pago
          this.selectedTabIndex = 4; // Tab de Solicitud de Pago
          this.loadTabDataIfNeeded(4);
          
          // Mostrar notificación de éxito
          this.notificacionService.openSucess('Recepción física completada. Navegando a Solicitud de Pago.');
        } else {
          // Aún hay recepciones pendientes, solo actualizar estados de tabs
          // Obtener etapa actual del pedido para actualizar tabs correctamente
          const etapaActual = this.pedidoResumen?.etapaActual 
            ? (typeof this.pedidoResumen.etapaActual === 'string' 
                ? this.pedidoResumen.etapaActual 
                : this.pedidoResumen.etapaActual?.tipoEtapa)
            : null;
          this.updateTabStates(etapaActual as ProcesoEtapaTipo | null);
          this.notificacionService.openSucess('Recepción física parcial completada. Puede continuar verificando otras sucursales.');
        }
      } else {
        // Fallback: actualizar estados de tabs sin navegar
        // Obtener etapa actual del pedido para actualizar tabs correctamente
        const etapaActual = this.pedidoResumen?.etapaActual 
          ? (typeof this.pedidoResumen.etapaActual === 'string' 
              ? this.pedidoResumen.etapaActual 
              : this.pedidoResumen.etapaActual?.tipoEtapa)
          : null;
        this.updateTabStates(etapaActual as ProcesoEtapaTipo | null);
      }
    }, 500); // Delay para asegurar que los datos se hayan recargado
    
    console.log('Navegación completada - Tab actual:', this.selectedTabIndex);
  }

  /**
   * Actualiza los datos del header del pedido
   */
  private updateHeaderData(): void {
    if (this.pedidoResumen) {
      this.headerDataComputed.estado = this.getEstadoFromResumen(this.pedidoResumen.etapaActual);
      this.headerDataComputed.montoTotal = this.calculateMontoTotalEditMode();
      this.estadoChipColorComputed = this.getEstadoChipColor();
    }
  }

  // ===== MÉTODOS PARA PRODUCTOS DEL PROVEEDOR Y ÚLTIMAS COMPRAS =====

  /**
   * Carga los productos del proveedor
   */
  private loadProductosProveedor(): void {
    const proveedorId = this.currentPedido?.proveedor?.id || 
                       this.datosGeneralesForm.get("proveedor")?.value?.id;
    
    if (!proveedorId) {
      console.log("No hay proveedor seleccionado, no se cargan productos");
      this.productosProveedorDataSource.data = [];
      return;
    }

    this.productosProveedorLoading = true;

    this.productoProveedorService
      .getByProveedorId(
        proveedorId,
        this.productosProveedorSearchText || '',
        this.productosProveedorPageIndex,
        this.productosProveedorPageSize
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log("Productos del proveedor cargados:", response);
          
          const productos = (response.getContent || []).map((pp: ProductoProveedor) => {
            const precioPrincipal = pp.producto?.precioPrincipal;
            
            const item: ProductoProveedorItem = {
              ...pp,
              descripcionComputed: pp.producto?.descripcion || '',
              precioDisplayComputed: this.formatNumber(precioPrincipal),
              isSelectedComputed: false
            };
            return item;
          });

          this.productosProveedorDataSource.data = productos;
          this.productosProveedorTotalElements = response.getTotalElements || 0;
          this.productosProveedorLoading = false;
        },
        error: (error) => {
          console.error("Error cargando productos del proveedor:", error);
          this.notificacionService.openAlgoSalioMal(
            "Error al cargar los productos del proveedor"
          );
          this.productosProveedorLoading = false;
        },
      });
  }

  /**
   * Carga las últimas compras de un producto
   */
  private loadUltimasCompras(productoId: number): void {
    if (!productoId) {
      this.ultimasComprasDataSource.data = [];
      this.ultimasComprasAllData = [];
      this.ultimasComprasTotalElements = 0;
      this.ultimasComprasPageIndex = 0;
      return;
    }

    this.ultimasComprasLoading = true;

    this.productoUltimasComprasGQL
      .fetch({ id: productoId }, { fetchPolicy: 'network-only' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log("Últimas compras cargadas:", response);
          
          // La respuesta tiene la estructura: response.data.data.productoUltimasCompras
          const producto = response.data?.data;
          const ultimasCompras = (producto?.productoUltimasCompras || []) as any[];

          const compras = ultimasCompras.map((compra: any) => {
            const item: UltimaCompraItem = {
              pedido: compra.pedido,
              cantidad: compra.cantidad || 0,
              precio: compra.precio || 0,
              creadoEn: compra.creadoEn ? new Date(compra.creadoEn) : new Date(),
              fechaDisplayComputed: compra.creadoEn 
                ? this.formatDate(new Date(compra.creadoEn))
                : 'Sin fecha',
              proveedorDisplayComputed: compra.pedido?.proveedor?.persona?.nombre || 'N/A',
              precioDisplayComputed: this.formatNumber(compra.precio)
            };
            return item;
          });

          // Guardar todos los datos y aplicar paginación del lado del cliente
          this.ultimasComprasAllData = compras;
          this.ultimasComprasTotalElements = compras.length;
          this.applyUltimasComprasPagination();
          this.ultimasComprasLoading = false;
        },
        error: (error) => {
          console.error("Error cargando últimas compras:", error);
          this.notificacionService.openAlgoSalioMal(
            "Error al cargar las últimas compras del producto"
          );
          this.ultimasComprasLoading = false;
        },
      });
  }

  /**
   * Maneja el click en un producto del proveedor
   */
  onProductoProveedorClick(producto: ProductoProveedorItem): void {
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - this.lastClickTime;
    const isDoubleClick = timeSinceLastClick < 300 && this.lastClickedProduct === producto;

    if (isDoubleClick) {
      // Doble click: abrir diálogo
      this.onProductoProveedorDoubleClick(producto);
      this.lastClickTime = 0;
      this.lastClickedProduct = null;
    } else {
      // Click simple: seleccionar y cargar últimas compras
      // Deseleccionar el producto anterior
      if (this.selectedProductoProveedor) {
        this.selectedProductoProveedor.isSelectedComputed = false;
      }
      
      // Seleccionar el nuevo producto
      producto.isSelectedComputed = true;
      this.selectedProductoProveedor = producto;
      
      // Cargar últimas compras
      if (producto.producto?.id) {
        this.loadUltimasCompras(producto.producto.id);
      }
      
      this.lastClickTime = currentTime;
      this.lastClickedProduct = producto;
    }
  }

  /**
   * Maneja el doble click en un producto del proveedor
   */
  onProductoProveedorDoubleClick(producto: ProductoProveedorItem): void {
    if (!producto.producto) {
      this.notificacionService.openAlgoSalioMal("El producto no tiene información válida");
      return;
    }

    // Verificar si el producto ya está en la lista de items
    const productoExists = this.checkProductoExistsInItems(producto.producto.id);
    
    if (productoExists) {
      // Mostrar diálogo de confirmación
      this.dialogosService.confirm(
        "Producto ya existe",
        `El producto "${producto.producto.descripcion}" ya se encuentra en la lista de items. ¿Desea modificarlo o agregarlo separadamente?`,
        undefined, // message2
        undefined, // listMessages
        true, // action
        "Modificar",
        "Agregar Separadamente",
        "Cancelar"
      ).subscribe((result) => {
        if (result === true) {
          // Modificar: encontrar el item existente y abrir diálogo de edición
          const existingItem = this.itemsDataSource.data.find(
            item => item.producto?.id === producto.producto.id
          );
          if (existingItem) {
            const index = this.itemsDataSource.data.indexOf(existingItem);
            this.onEditItem(existingItem, index);
          }
        } else if (result === 'agregar') {
          // Agregar separadamente: abrir diálogo de agregar
          this.onOpenAddItemDialogWithProduct(producto.producto);
        }
        // Si result es null o undefined, no hacer nada (cancelar)
      });
    } else {
      // Abrir diálogo de agregar item
      this.onOpenAddItemDialogWithProduct(producto.producto);
    }
  }

  /**
   * Verifica si un producto ya existe en la lista de items
   */
  private checkProductoExistsInItems(productoId: number): boolean {
    return this.itemsDataSource.data.some(
      item => item.producto?.id === productoId
    );
  }

  /**
   * Abre el diálogo de agregar item con un producto precargado
   */
  private onOpenAddItemDialogWithProduct(producto: Producto): void {
    if (!this.currentPedido) {
      this.notificacionService.openAlgoSalioMal("No hay pedido seleccionado");
      return;
    }

    // Necesitamos cargar el producto completo con presentaciones y costo
    // Si el producto ya tiene estas propiedades, usarlo directamente
    // Si no, necesitamos cargarlo desde el backend
    
    const dialogData: AddEditItemDialogData = {
      pedido: this.currentPedido,
      isEdit: false,
      title: "Añadir Nuevo Ítem al Pedido",
    };

    const dialogRef = this.dialog.open(AddEditItemDialogComponent, {
      width: "50%",
      height: "70%",
      data: dialogData,
      disableClose: true,
    });

    // Después de abrir el diálogo, precargar el producto
    dialogRef.afterOpened().subscribe(() => {
      const dialogComponent = dialogRef.componentInstance;
      // El producto del ProductoProveedor ya debería tener presentaciones y costo
      // según la query GraphQL actualizada
      if (dialogComponent && producto) {
        // Verificar si el producto tiene presentaciones
        if (producto.presentaciones && producto.presentaciones.length > 0) {
          // El producto ya tiene presentaciones, podemos usarlo directamente
          dialogComponent.onProductoSelected(producto, producto.presentaciones[0]);
        } else {
          // Si no tiene presentaciones, intentar usar el producto tal como está
          // El diálogo manejará la carga de presentaciones si es necesario
          dialogComponent.onProductoSelected(producto);
        }
      }
    });

    dialogRef.afterClosed().subscribe((result: AddEditItemDialogResult) => {
      if (result && result.action === "save") {
        console.log("Nuevo ítem añadido desde productos del proveedor:", result.item);
        
        // Marcar tab de ítems como no cargado para recargar en próxima visita
        this.markTabAsUnloaded(1);
        
        // Si estamos en el tab de ítems, recargar inmediatamente
        if (this.selectedTabIndex === 1) {
          // Resetear a primera página y recargar
          this.itemsPageIndex = 0;
          this.loadItemsData();
        } else {
          this.updateItemsComputedProperties();
        }
        
        // Recargar resumen del pedido para actualizar header
        if (this.isEditMode) {
          this.loadPedidoResumen();
        }
      }
    });
  }

  /**
   * Maneja el cambio de página en la lista de productos del proveedor
   */
  onProductosProveedorPageChange(event: any): void {
    this.productosProveedorPageIndex = event.pageIndex;
    this.productosProveedorPageSize = event.pageSize;
    this.loadProductosProveedor();
  }

  /**
   * Maneja el cambio de búsqueda en la lista de productos del proveedor
   */
  onProductosProveedorSearchChange(searchText: string): void {
    this.productosProveedorSearchText = searchText;
    this.productosProveedorPageIndex = 0; // Reset to first page
    this.loadProductosProveedor();
  }

  /**
   * Aplica la paginación del lado del cliente a las últimas compras
   */
  private applyUltimasComprasPagination(): void {
    const startIndex = this.ultimasComprasPageIndex * this.ultimasComprasPageSize;
    const endIndex = startIndex + this.ultimasComprasPageSize;
    const paginatedData = this.ultimasComprasAllData.slice(startIndex, endIndex);
    this.ultimasComprasDataSource.data = paginatedData;
  }

  /**
   * Maneja el cambio de página en la lista de últimas compras
   */
  onUltimasComprasPageChange(event: any): void {
    this.ultimasComprasPageIndex = event.pageIndex;
    this.ultimasComprasPageSize = event.pageSize;
    this.applyUltimasComprasPagination();
  }

  /**
   * Desvincula un producto del proveedor con el motivo especificado
   */
  onDesvincularProducto(producto: ProductoProveedorItem, motivo: string): void {
    if (!producto.id) {
      this.notificacionService.openAlgoSalioMal(
        "No se pudo identificar el producto a desvincular"
      );
      return;
    }

    this.desvincularProductoProveedorGQL
      .mutate({
        id: producto.id,
        motivo: motivo
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data?.data) {
            this.notificacionService.openSucess(
              "Producto desvinculado correctamente"
            );
            // Recargar la lista de productos
            this.loadProductosProveedor();
            // Si el producto desvinculado estaba seleccionado, limpiar la selección
            if (this.selectedProductoProveedor?.id === producto.id) {
              this.selectedProductoProveedor = null;
              this.ultimasComprasDataSource.data = [];
          this.ultimasComprasAllData = [];
          this.ultimasComprasTotalElements = 0;
          this.ultimasComprasPageIndex = 0;
            }
          }
        },
        error: (error) => {
          console.error("Error desvinculando producto:", error);
          this.notificacionService.openAlgoSalioMal(
            "Error al desvincular el producto"
          );
        }
      });
  }
}