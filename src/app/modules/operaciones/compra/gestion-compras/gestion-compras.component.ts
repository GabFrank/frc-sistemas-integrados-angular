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
import { Subject, forkJoin } from "rxjs";
import { takeUntil } from "rxjs/operators";

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
} from "./dialogs/add-edit-nota-recepcion-dialog/add-edit-nota-recepcion-dialog.component";
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
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { ProcesoEtapaService } from "./proceso-etapa.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { MatPaginator } from "@angular/material/paginator";

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
}

type TabState = "disabled" | "readonly" | "editable";

@Component({
  selector: "app-gestion-compras",
  templateUrl: "./gestion-compras.component.html",
  styleUrls: ["./gestion-compras.component.scss"],
})
export class GestionComprasComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild("monedaSelect", { read: MatSelect }) monedaSelect!: MatSelect;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("itemsPendientesPaginator", { read: MatPaginator }) itemsPendientesPaginator!: MatPaginator;
  @ViewChild("notasRecepcionPaginator", { read: MatPaginator }) notasRecepcionPaginator!: MatPaginator;
  @Input() data: any; // TabData from TabService

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
  step2ButtonDisabledComputed = true;
  step2ButtonTextComputed = "Finalizar Planificación";

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
  hasItemsComputed = false;
  canFinalizePlanningComputed = false;

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
  notasRecepcionDisplayedColumns = ["numero", "fecha", "estado", "acciones"];
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
    private dialogosService: DialogosService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Verificar si se recibió un ID de pedido desde TabData
    if (this.data?.tabData?.data?.id) {
      this.pedidoId = this.data.tabData.data.id;
      this.isEditMode = true;
      console.log("Cargando pedido existente con ID:", this.pedidoId);
    }

    this.loadInitialData();

    // Si hay un ID, cargar el pedido
    if (this.pedidoId) {
      this.loadPedidoExistente();
    } else {
      // Modo creación: cargar datos del tab inicial (Datos Generales)
      this.loadTabDataIfNeeded(0);
    }

    this.updateComputedProperties();
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
        }
      });
  }

  private loadInitialData(): void {
    // Load data for selects from backend
    this.monedaService.onGetAll().subscribe({
      next: (data) => {
        this.monedas = data;
        console.log("Monedas cargadas:", data);

        // Initialize with first value if available
        if (data.length > 0) {
          this.datosGeneralesForm.patchValue({
            moneda: data[0],
          });
        }
      },
      error: (error) => {
        console.error("Error cargando monedas:", error);
      },
    });

    this.formaPagoService.onGetAllFormaPago().subscribe({
      next: (data) => {
        this.formasPago = data;
        console.log("Formas de pago cargadas:", data);

        // Initialize with first value if available
        if (data.length > 0) {
          this.datosGeneralesForm.patchValue({
            formaPago: data[0],
          });
        }
      },
      error: (error) => {
        console.error("Error cargando formas de pago:", error);
      },
    });

    this.sucursalService.onGetAllSucursales().subscribe({
      next: (data) => {
        this.sucursales = data;
        console.log("Sucursales cargadas:", data);
      },
      error: (error) => {
        console.error("Error cargando sucursales:", error);
      },
    });

    // Initialize form with default values
    this.datosGeneralesForm.patchValue({
      proveedor: null,
      vendedor: null,
      plazoCredito: null,
      sucursalesEntrega: [],
      sucursalesInfluencia: [],
    });
  }

  private loadPedidoExistente(): void {
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
          
          // Cargar solo el resumen básico para el header (sin datos de ítems)
          this.loadPedidoResumenBasico();
          
          this.updateComputedProperties();

          console.log("Pedido cargado exitosamente:", result.pedido);
          console.log("Etapa actual:", result.etapaActual);
        },
        error: (error) => {
          console.error("Error cargando datos del pedido:", error);
          this.notificacionService.openAlgoSalioMal("Error al cargar los datos del pedido");
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
        console.log("Resumen del pedido cargado:", resumen);
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

  getStep2ButtonText(): string {
    return this.isEditMode ? "Actualizar Planificación" : "Finalizar Planificación";
  }

  shouldDisableStep1Button(): boolean {
    // make disabled if form is not touched by user
    return this.datosGeneralesForm.invalid || this.datosGeneralesTabState !== "editable" || !this.datosGeneralesForm.dirty;
  }

  shouldDisableStep2Button(): boolean {
    return !this.canFinalizePlanningComputed || this.itemsTabState !== "editable";
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
    const pedidoInput = {
      id: this.currentPedido!.id, // Incluir el ID para actualizar
      proveedorId: formValue.proveedor?.id,
      vendedorId: formValue.vendedor?.id,
      monedaId: formValue.moneda?.id,
      formaPagoId: formValue.formaPago?.id,
      plazoCredito: formValue.plazoCredito,
      usuarioId: this.currentPedido!.usuario?.id || 1, // Mantener el usuario original
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

          // Mostrar mensaje de éxito
          this.notificacionService.openSucess("Datos generales actualizados exitosamente");

          // Update computed properties (esto habilitará los tabs)
          this.updateComputedProperties();

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

          // Actualizar propiedades computadas (esto habilitará los tabs)
          this.updateComputedProperties();

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
    if (this.isEditMode && this.pedidoResumen) {
      this.headerDataComputed = {
        id: this.currentPedido?.id || undefined,
        proveedor: this.currentPedido?.proveedor?.persona?.nombre ||
                   this.selectedProveedorComputed?.persona?.nombre ||
                   formValue.proveedor?.persona?.nombre ||
                   "No seleccionado",
        fechaCreacion: this.currentPedido?.creadoEn || new Date(),
        estado: this.getEstadoFromResumen(this.pedidoResumen.etapaActual),
        montoTotal: this.pedidoResumen.valorTotal,
        moneda: this.currentPedido?.moneda || null,
        plazoCredito: this.currentPedido?.plazoCredito || 0,
      };
    } else {
      // Modo creación o sin resumen - usar cálculo local
      this.headerDataComputed = {
        id: this.currentPedido?.id || undefined,
        proveedor: this.currentPedido?.proveedor?.persona?.nombre ||
                   this.selectedProveedorComputed?.persona?.nombre ||
                   formValue.proveedor?.persona?.nombre ||
                   "No seleccionado",
        fechaCreacion: this.currentPedido?.creadoEn || new Date(),
        estado: this.getEstadoGeneral(),
        montoTotal: this.calculateMontoTotal(),
        moneda: this.currentPedido?.moneda || null,
        plazoCredito: this.currentPedido?.plazoCredito || 0,
      };
    }

    // Update tab enable/disable status
    // this.updateTabStates(etapaActual); // Se llama desde loadPedidoExistente

    // Update items computed properties
    this.updateItemsComputedProperties();

    // Update step 3 computed properties
    this.updateStep3ComputedProperties();

    // Update computed properties for UI (siguiendo regla @no-direct-function-calls-in-template.mdc)
    this.estadoChipColorComputed = this.getEstadoChipColor();
    this.vendedorDisplayTextComputed = this.displayVendedor(formValue.vendedor);
    this.isFormaPagoCreditoComputed = this.isFormaPagoCredito();
    this.step1ButtonDisabledComputed = this.shouldDisableStep1Button();
    this.step1ButtonTextComputed = this.getStep1ButtonText();
    this.step2ButtonDisabledComputed = this.shouldDisableStep2Button();
    this.step2ButtonTextComputed = this.getStep2ButtonText();
  }

  private calculateMontoTotal(): number {
    // Calculate total from items
    const items = this.itemsDataSource.data;
    return items.reduce((total, item) => {
      return total + (item.cantidadSolicitada * item.precioUnitarioSolicitado);
    }, 0);
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
    this.canAssignItemsToNotaComputed = this.selectedItemsPendientes.length > 0; // Solo requiere ítems seleccionados

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

    // Update basic counts from items data
    this.itemsCountComputed = items.length;
    this.hasItemsComputed = items.length > 0;

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

    // Can finalize planning if there are items (distribution completion no longer required)
    this.canFinalizePlanningComputed = this.hasItemsComputed;

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

  private calculateNotaComputedProperties(nota: NotaRecepcion): void {
    // Calculate formatted date
    // TODO: Implementar algo aqui
    // nota.fechaFormattedComputed = this.formatDate(nota.fecha);

    // // Calculate chip color
    // nota.estadoChipColorComputed = this.getEstadoNotaRecepcionChipColor(nota.estado);

    // // Calculate display name
    // nota.estadoDisplayNameComputed = this.getEstadoNotaRecepcionDisplayName(nota.estado);

    // // Calculate selection status
    // nota.isSelectedComputed = this.isNotaRecepcionSelected(nota);
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

    // Default state: a new pedido or loading state
    this.datosGeneralesTabState = "editable";
    this.itemsTabState = "disabled";
    this.notasTabState = "disabled";
    this.mercaderiaTabState = "disabled";
    this.pagoTabState = "disabled";

    if (!this.isEditMode || !etapaActual) {
      console.log("Navegando a la pestaña de Datos Generales");
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

      case ProcesoEtapaTipo.PAGO:
        this.datosGeneralesTabState = "readonly";
        this.itemsTabState = "readonly";
        this.notasTabState = "readonly";
        this.mercaderiaTabState = "readonly";
        this.pagoTabState = "readonly"; // Process finished
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
        if (this.currentPedido?.id) {
          this.loadItemsData();
          // Cargar el resumen completo cuando se accede al tab de ítems
          this.loadPedidoResumen();
        }
        break;
      case 2: // Tab 3: Recepción de Notas
        if (this.currentPedido?.id) {
          this.loadItemsPendientesData();
          this.loadNotasRecepcionData();
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
        this.monedaSelect.focus();
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
      }
    });
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

  // Handle form changes
  onFormaPagoChange(): void {
    // const formaPago = this.datosGeneralesForm.get('formaPago')?.value;
    // if (formaPago && formaPago.descripcion !== 'CREDITO') {
    //   this.datosGeneralesForm.get('plazoCredito')?.setValue(null);
    // }

    // // Update computed property
    // this.isFormaPagoCreditoComputed = this.isFormaPagoCredito();
  }

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
          this.reloadTabData(1);
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
          this.reloadTabData(1);
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
              this.reloadTabData(1);
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
              this.reloadTabData(1);
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
                this.reloadTabData(1);
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
   * Carga los datos de los ítems del pedido desde el backend
   */
  private loadItemsData(): void {
    if (!this.currentPedido?.id) {
      return;
    }

    this.pedidoService.onGetPedidoItemsByPedidoId(this.currentPedido.id).subscribe({
      next: (items) => {
        console.log("Ítems cargados:", items);
        
        // Procesar los ítems y añadir propiedades computadas
        const processedItems = items.map(item => this.processItemForDisplay(item));
        
        // Actualizar la tabla
        this.itemsDataSource.data = processedItems;
        
        // Actualizar propiedades computadas
        this.updateItemsComputedProperties();
      },
      error: (error) => {
        console.error("Error cargando ítems:", error);
        this.notificacionService.openAlgoSalioMal("Error al cargar los ítems del pedido");
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
   */
  private loadNotasRecepcionData(): void {
    if (!this.currentPedido?.id) return;

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
          console.log("Notas de recepción cargadas:", response);
          
          // Procesar notas para mostrar
          const processedNotas = (response.getContent || []).map((nota: NotaRecepcion) => {
            const mockNota = this.processNotaForDisplay(nota) as MockNotaRecepcion;
            return mockNota;
          });

          this.notasRecepcionDataSource.data = processedNotas;
          this.notasRecepcionTotalElements = response.getTotalElements || 0;
          this.notasRecepcionLoading = false;
          
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
  private processItemForDisplay(item: PedidoItem): any {
    const processedItem = {
      ...item,
      // Añadir propiedades computadas necesarias para la UI
      subtotalComputed: item.cantidadSolicitada * item.precioUnitarioSolicitado,
      distributionStatusTextComputed: item.distribucionConcluida ? "Concluida" : "Pendiente", 
      distributionStatusClassComputed: item.distribucionConcluida ? "estado-activo" : "estado-pendiente",
      isSelectedComputed: false
    };

    return processedItem;
  }

  /**
   * Procesa una nota de recepción para añadir propiedades computadas necesarias para la UI
   */
  private processNotaForDisplay(nota: NotaRecepcion): any {
    const processedNota = {
      ...nota,
      // Añadir propiedades computadas necesarias para la UI
      fechaFormattedComputed: nota.fecha ? this.formatDate(new Date(nota.fecha)) : '',
      estadoChipColorComputed: this.getEstadoNotaRecepcionChipColor(nota.estado),
      estadoDisplayNameComputed: this.getEstadoNotaRecepcionDisplayName(nota.estado),
      isSelectedComputed: false
    };

    return processedNota;
  }

  onFinalizarPlanificacion(): void {
    if (!this.currentPedido?.id) {
      this.notificacionService.openAlgoSalioMal("No hay pedido seleccionado");
      return;
    }

    // Validar que hay ítems en el pedido
    if (!this.hasItemsComputed) {
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
    };

    const dialogRef = this.dialog.open(AddEditNotaRecepcionDialogComponent, {
      width: "80%",
      height: "80%",
      data: dialogData,
      disableClose: true,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log("Nueva nota creada:", result);

        // Add to panel derecho
        const currentData = this.notasRecepcionDataSource.data;
        result.id = currentData.length + 1; // Mock ID
        currentData.push(result);
        this.notasRecepcionDataSource.data = [...currentData];

        // Asignar ítems seleccionados a la nueva nota (simulado)
        this.asignarItemsANota(result);

        this.updateComputedProperties();
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

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log("Nueva nota creada:", result);

        // Recargar datos reales del backend
        this.markTabAsUnloaded(2);
        this.reloadTabData(2);

        this.updateComputedProperties();
        this.notificacionService.openSucess("Nota de recepción creada exitosamente");
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
            this.notificacionService.openSucess(result.message);
            
            // Limpiar selección
            this.selectedItemsPendientes = [];
            
            // Recargar datos para reflejar los cambios
            this.markTabAsUnloaded(3);
            this.reloadTabData(3);
            
            this.updateComputedProperties();
          } else {
            this.notificacionService.openAlgoSalioMal(result.message);
          }
          
          // Mostrar errores específicos si los hay
          if (result.errores && result.errores.length > 0) {
            const errores = result.errores.map(e => `Ítem ${e.pedidoItemId}: ${e.error}`).join('\n');
            this.notificacionService.openAlgoSalioMal(`Errores en la asignación:\n${errores}`);
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

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log("Nota actualizada:", result);

        // Recargar datos reales del backend
        this.markTabAsUnloaded(2);
        this.reloadTabData(2);

        this.updateComputedProperties();
      }
    });
  }

  onGestionarItemsDeLaNota(nota: NotaRecepcion): void {
    // TODO: Implementar diálogo para gestionar ítems de la nota
    console.log("Gestionar ítems de la nota:", nota.numero);
  }

  onDeleteNotaRecepcion(index: number): void {
    const nota = this.notasRecepcionDataSource.data[index];

    // TODO: Use DialogosService for confirmation
    if (confirm(`¿Está seguro de eliminar la nota ${nota.numero}?`)) {
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
  }

  onFinalizarConciliacion(): void {
    console.log("Finalizando conciliación documental");
    // TODO: Implement backend integration with strict validations per manual

    // Validaciones según manual:
    // 1. Se verifica que existan notas registradas
    if (this.notasRecepcionCountComputed === 0) {
      alert("Debe registrar al menos una nota de recepción para finalizar la conciliación.");
      return;
    }

    // Simular la actualización de estado en el pedido actual
    if (this.currentPedido && this.currentPedido.procesoEtapas) {
      const etapaRecepcionNota = this.currentPedido.procesoEtapas.find((e) => e.tipoEtapa === ProcesoEtapaTipo.RECEPCION_NOTA);
      if (etapaRecepcionNota) {
        etapaRecepcionNota.estadoEtapa = ProcesoEtapaEstado.COMPLETADA;
      }

      const etapaRecepcionMercaderia = this.currentPedido.procesoEtapas.find((e) => e.tipoEtapa === ProcesoEtapaTipo.RECEPCION_MERCADERIA);
      if (etapaRecepcionMercaderia) {
        etapaRecepcionMercaderia.estadoEtapa = ProcesoEtapaEstado.EN_PROCESO;
      }
    }

    this.updateComputedProperties();
    this.selectedTabIndex = 3; // Navegar a la pestaña de Mercadería
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
    return new Intl.DateTimeFormat("es-PY").format(date);
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
        return "primary"; // Blue/Orange
      case NotaRecepcionEstado.PENDIENTE_CONCILIACION:
        return "warn"; // Yellow
      default:
        return "primary";
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

  // Método para verificar si se puede navegar a un paso específico
  canNavigateToStep(stepIndex: number): boolean {
    if (!this.isEditMode) {
      return stepIndex <= this.selectedTabIndex;
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
}