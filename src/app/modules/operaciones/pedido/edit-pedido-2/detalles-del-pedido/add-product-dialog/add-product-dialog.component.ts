import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from "@angular/material/dialog";
import { MatSelect } from "@angular/material/select";
import { MatButton } from "@angular/material/button";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

import { Pedido } from "../../../edit-pedido/pedido.model";
import { PedidoItem } from "../../../edit-pedido/pedido-item.model";
import { PedidoStep } from "../../../edit-pedido/pedido-item.model";
import { PedidoEstado } from "../../../edit-pedido/pedido-enums";
import { ProductoProveedor } from "../../../../../productos/producto-proveedor/producto-proveedor.model";
import { Producto } from "../../../../../productos/producto/producto.model";
import { CompraItem } from "../../../../compra/compra-item.model";

import { ProductoProveedorService } from "../../../../../productos/producto-proveedor/producto-proveedor.service";
import { PedidoService } from "../../../pedido.service";
import { ProductoService } from "../../../../../productos/producto/producto.service";
import { MainService } from "../../../../../../main.service";
import { NotificacionSnackbarService } from "../../../../../../notificacion-snackbar.service";
import { PageInfo } from "../../../../../../app.component";
import { CurrencyMask } from "../../../../../../commons/core/utils/numbersUtils";
import { DialogosService } from "../../../../../../shared/components/dialogos/dialogos.service";

// Import PdvSearchProductoDialog components
import {
  PdvSearchProductoDialogComponent,
  PdvSearchProductoData,
  PdvSearchProductoResponseData,
} from "../../../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";



export interface AddProductDialogData {
  pedido: Pedido;
  pedidoItem?: PedidoItem; // Optional - for editing existing items
  isEditing?: boolean; // Flag to indicate edit mode
  currentStep?: PedidoStep; // Current step context
  readOnly?: boolean; // Flag to indicate read-only mode (view only)
}

export interface AddProductDialogResult {
  // Basic operation results
  added?: boolean;
  updated?: boolean;
  cancelled?: boolean;
  
  // Change indicators
  productConfigurationChanged?: boolean;
  sucursalDistributionChanged?: boolean;
  rejectionStatusChanged?: boolean;
  itemCancellationChanged?: boolean;
  needsDistributionUpdate?: boolean;
  
  // UI refresh indicator
  needsUIRefresh?: boolean;
  
  // Data objects
  pedidoItem?: PedidoItem;
  step?: PedidoStep;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-add-product-dialog",
  templateUrl: "./add-product-dialog.component.html",
  styleUrls: ["./add-product-dialog.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddProductDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("productosProveedorPaginator")
  productosProveedorPaginator: MatPaginator;

  // Form field references for focus management
  @ViewChild("buscarProductoDirectoInput")
  buscarProductoDirectoInput: ElementRef<HTMLInputElement>;
  @ViewChild("presentacionSelect") presentacionSelect: MatSelect;
  @ViewChild("cantidadInput") cantidadInput: ElementRef<HTMLInputElement>;
  @ViewChild("precioUnitarioInput")
  precioUnitarioInput: ElementRef<HTMLInputElement>;
  @ViewChild("precioPorPresentacionInput")
  precioPorPresentacionInput: ElementRef<HTMLInputElement>;
  @ViewChild("descuentoUnitarioInput")
  descuentoUnitarioInput: ElementRef<HTMLInputElement>;
  @ViewChild("descuentoPorPresentacionInput")
  descuentoPorPresentacionInput: ElementRef<HTMLInputElement>;
  @ViewChild("agregarButton") agregarButton: MatButton;
  


  // Form controls
  buscarProductoControl = new FormControl("");
  buscarProductoDirectoControl = new FormControl("");

  // Product selection form
  productSelectionFormGroup = new FormGroup({
    presentacion: new FormControl(
      { value: null, disabled: true },
      Validators.required
    ),
    cantidad: new FormControl({ value: 1, disabled: true }, [
      Validators.required,
      Validators.min(0.01),
    ]),
    precioUnitario: new FormControl({ value: 0, disabled: true }, [
      Validators.required,
      Validators.min(0),
    ]),
    precioPorPresentacion: new FormControl({ value: 0, disabled: true }, [
      Validators.min(0),
    ]),
    descuentoUnitario: new FormControl({ value: 0, disabled: true }, [
      Validators.min(0),
    ]),
    descuentoPorPresentacion: new FormControl({ value: 0, disabled: true }, [
      Validators.min(0),
    ]),
    // Add observations fields for all estados
    obsCreacion: new FormControl({ value: '', disabled: true }, [
      Validators.maxLength(500)
    ]),
    obsRecepcionNota: new FormControl({ value: '', disabled: true }, [
      Validators.maxLength(500)
    ]),
    obsRecepcionProducto: new FormControl({ value: '', disabled: true }, [
      Validators.maxLength(500)
    ]),
  });

  // Data sources
  productosProveedorDataSource = new MatTableDataSource<ProductoProveedor>([]);
  historicoComprasDataSource = new MatTableDataSource<any>([]);

  // Table columns
  productosProveedorColumns = ["codigo", "descripcion", "stock", "acciones"];
  historicoComprasColumns = [
    "fecha",
    "proveedor",
    "cantidad",
    "precio",
    "acciones",
  ];

  // Selected items
  selectedProductoProveedor: ProductoProveedor;
  selectedProducto: Producto;

  // Pagination
  productosProveedorPage: PageInfo<ProductoProveedor>;

  // Loading states
  isLoadingProductos = false;
  isLoadingHistorico = false;
  isDialogOpen = false;

  // Focus management state
  private presentacionEnterCount = 0;

  // Calculation state
  private isCalculating = false;

  // Currency mask for money fields
  currencyMask = new CurrencyMask();

  // Total preview value - calculated only when needed
  totalPreview = 0;
  totalDescuento = 0;

  // Price validation
  originalPrice = 0;
  priceChangeMessage = "";
  priceChangeType: "higher" | "lower" | "none" = "none";
  priceChangePercentage = 0;
  showPriceWarning = false;

  // Step context - computed property instead of getter
  currentStep: PedidoStep = PedidoStep.DETALLES_PEDIDO;
  
  // Computed properties for template usage
  isDetallesPedidoStep = false;
  isRecepcionNotaStep = false;
  isRecepcionProductoStep = false;
  canModifyInCurrentStep = false;
  currentStepDisplayName = '';
  isFormInvalidOrNoProduct = true;
  isItemCanceled = false;
  isReadOnlyMode = false; // NEW: Read-only mode flag
  
  // Modification tracking
  hasModifications = false;

  // Track original values for presentacion/cantidad changes
  originalPresentacionId: number | null = null;

  // **PERFORMANCE**: Debounced calculation methods to prevent excessive calls
  private calculationTimeout: any = null;
  private updateComputedPropertiesTimeout: any = null;
  originalCantidad: number | null = null;

  // Tab navigation
  selectedTabIndex = 0;

  // **FIX**: Public property for template access (no getter/setter performance issues)
  currentPedidoItemForEmbedded: PedidoItem | null = null;

  // Change tracking for UI refresh decisions
  private changeTracker = {
    productConfigurationChanged: false,
    sucursalDistributionChanged: false,
    rejectionStatusChanged: false,
    itemCancellationChanged: false,
    itemAdded: false,
    itemUpdated: false,
    needsDistributionUpdate: false
  };

  constructor(
    public dialogRef: MatDialogRef<AddProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddProductDialogData,
    private productoProveedorService: ProductoProveedorService,
    private pedidoService: PedidoService,
    private productoService: ProductoService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private dialogosService: DialogosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    // **PERFORMANCE**: Clean up timeouts to prevent memory leaks
    if (this.calculationTimeout) {
      clearTimeout(this.calculationTimeout);
    }
    if (this.updateComputedPropertiesTimeout) {
      clearTimeout(this.updateComputedPropertiesTimeout);
    }
  }

  ngOnInit(): void {
    // **OPTIMIZED**: Set read-only mode first, then initialize everything else
    this.isReadOnlyMode = this.data?.readOnly === true;
    
    this.setupFormSubscriptions();
    this.loadProductosProveedor();
    this.updateComputedProperties();

    // If editing an existing item, load its data
    if (this.data.isEditing && this.data.pedidoItem) {
      this.loadPedidoItemForEditing();
    }

    // Initialize current pedido item for embedded components
    this.updateCurrentPedidoItemForEmbedded();
  }

  ngAfterViewInit(): void {
    // Focus on search field when view is ready
    setTimeout(() => {
      this.focusBuscarProducto();
    }, 100);
  }

  private setupFormSubscriptions(): void {
    // Search productos debounced
    this.buscarProductoControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), untilDestroyed(this))
      .subscribe(() => {
        this.loadProductosProveedor();
      });

    // Calculate total when form values change and track modifications
    this.productSelectionFormGroup.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.calculateTotalPreview();
        this.updateComputedProperties();
        
        // Mark product configuration as changed if form has been touched and we're editing
        if (this.data.isEditing && this.productSelectionFormGroup.dirty) {
          this.markProductConfigurationChanged();
        }
      });

    // Handle precio calculations
    this.productSelectionFormGroup
      .get("precioUnitario")
      ?.valueChanges.pipe(untilDestroyed(this))
      .subscribe((precioUnitario) => {
        this.calculatePrecioPorPresentacion();
        this.validatePriceChange();
      });

    this.productSelectionFormGroup
      .get("precioPorPresentacion")
      ?.valueChanges.pipe(untilDestroyed(this))
      .subscribe((precioPorPresentacion) => {
        this.calculatePrecioUnitario();
        this.validatePriceChangeFromPresentacion();
      });

    // Handle descuento calculations
    this.productSelectionFormGroup
      .get("descuentoUnitario")
      ?.valueChanges.pipe(untilDestroyed(this))
      .subscribe((descuentoUnitario) => {
        this.calculateDescuentoPorPresentacion();
        this.validatePriceChange();
      });

    this.productSelectionFormGroup
      .get("descuentoPorPresentacion")
      ?.valueChanges.pipe(untilDestroyed(this))
      .subscribe((descuentoPorPresentacion) => {
        this.calculateDescuentoUnitario();
        this.validatePriceChangeFromPresentacion();
      });

    // Recalculate when presentacion changes
    this.productSelectionFormGroup
      .get("presentacion")
      ?.valueChanges.pipe(untilDestroyed(this))
      .subscribe(() => {
        this.calculatePrecioPorPresentacion();
        this.calculateDescuentoPorPresentacion();
        this.clearPriceWarning(); // Clear warnings when presentation changes
      });
  }

  loadProductosProveedor(page = 0, size = 15): void {
    if (!this.data.pedido?.proveedor) return;

    this.isLoadingProductos = true;
    this.cdr.markForCheck(); // Trigger change detection for loading state
    
    const texto = this.buscarProductoControl.value || "";

    this.productoProveedorService
      .getByProveedorId(this.data.pedido.proveedor.id, texto, page, size)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.productosProveedorPage = response;
          this.productosProveedorDataSource.data = response.getContent;
          this.isLoadingProductos = false;
          this.cdr.markForCheck(); // Trigger change detection when loading completes
        },
        error: () => {
          this.isLoadingProductos = false;
          this.cdr.markForCheck(); // Trigger change detection on error
          this.notificacionService.openWarn(
            "Error al cargar productos del proveedor"
          );
        },
      });
  }

  onSearchProductoDirecto(): void {
    const searchTerm = this.buscarProductoDirectoControl.value?.trim();
    if (!searchTerm) {
      this.onOpenProductSearch();
      return;
    }

    // First try to find product by exact code
    this.isLoadingProductos = true;
    this.productoService
      .onGetProductoPorCodigo(searchTerm)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (producto) => {
          this.isLoadingProductos = false;
          if (producto) {
            this.onSelectProductoDirecto(producto);
          } else {
            // If not found by code, open search dialog with the search term
            this.onOpenProductSearch(searchTerm);
          }
        },
        error: () => {
          this.isLoadingProductos = false;
          // If error occurs, open search dialog with the search term
          this.onOpenProductSearch(searchTerm);
        },
      });
  }

  onOpenProductSearch(searchText?: string): void {
    if (this.isDialogOpen) return;

    this.isDialogOpen = true;
    const data: PdvSearchProductoData = {
      texto: searchText || this.buscarProductoDirectoControl.value,
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true,
    };

    this.matDialog
      .open(PdvSearchProductoDialogComponent, {
        data: data,
        height: "80%",
      })
      .afterClosed()
      .subscribe((res) => {
        this.isDialogOpen = false;
        const response: PdvSearchProductoResponseData = res;

        if (response?.producto) {
          this.selectedProducto = response.producto;
          this.selectedProductoProveedor = null; // Clear proveedor selection since this is direct search

          const ultimoPrecio =
            this.selectedProducto?.costo?.ultimoPrecioCompra || 0;
          const presentacion =
            response.presentacion ||
            this.selectedProducto.presentaciones?.find(
              (p) => p.principal === true
            );

          // if presentacion is not null, then copy presentacion.image to selectedProducto.imagenPrincipal
          if (presentacion) {
            this.selectedProducto.imagenPrincipal =
              presentacion.imagenPrincipal;
          }

          // Set original price for validation
          this.originalPrice = ultimoPrecio;
          this.clearPriceWarning();

          // Enable form controls
          this.enableFormControls();

          // Reset form with product data
          this.productSelectionFormGroup.patchValue({
            presentacion: presentacion,
            cantidad: response.cantidad || 1,
            precioUnitario: ultimoPrecio,
            precioPorPresentacion: presentacion?.cantidad
              ? ultimoPrecio * presentacion.cantidad
              : 0,
            descuentoUnitario: 0,
            descuentoPorPresentacion: 0,
          });

          // Update computed properties
          this.updateComputedProperties();

          // Update search field with product description
          this.buscarProductoDirectoControl.setValue(
            `${this.selectedProducto?.id} - ${this.selectedProducto?.descripcion}`
          );

          // Load historical purchases for this product
          this.loadHistoricoCompras();
          this.notificacionService.openSucess("Producto encontrado");

          // Focus on presentacion field after product is selected from dialog
          setTimeout(() => {
            this.focusPresentacion();
          }, 100);

          // Update current pedido item for embedded components
          this.updateCurrentPedidoItemForEmbedded();
        }
      });
  }

  onSelectProductoDirecto(producto: Producto): void {
    this.selectedProducto = producto;
    this.selectedProductoProveedor = null; // Clear proveedor selection since this is direct search

    const ultimoPrecio = this.selectedProducto?.costo?.ultimoPrecioCompra || 0;
    const presentacion = this.selectedProducto.presentaciones?.[0];

    // Set original price for validation
    this.originalPrice = ultimoPrecio;
    this.clearPriceWarning();

    // Enable form controls
    this.enableFormControls();

    // Reset form with product data
    this.productSelectionFormGroup.patchValue({
      presentacion: presentacion,
      cantidad: 1,
      precioUnitario: ultimoPrecio,
      precioPorPresentacion: presentacion?.cantidad
        ? ultimoPrecio * presentacion.cantidad
        : 0,
      descuentoUnitario: 0,
      descuentoPorPresentacion: 0,
    });

    // Update computed properties
    this.updateComputedProperties();

    // Update search field with product description
    this.buscarProductoDirectoControl.setValue(
      `${this.selectedProducto?.id} - ${this.selectedProducto?.descripcion}`
    );

    // Load historical purchases for this product
    this.loadHistoricoCompras();
    this.notificacionService.openSucess("Producto encontrado");

    // Focus on presentacion field after product is found
    setTimeout(() => {
      this.focusPresentacion();
    }, 100);

    // Update current pedido item for embedded components
    this.updateCurrentPedidoItemForEmbedded();
    
    // **FIX**: Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  onProductoProveedorSelect(productoProveedor: ProductoProveedor): void {
    this.selectedProductoProveedor = productoProveedor;
    this.selectedProducto = productoProveedor.producto;

    const ultimoPrecio = this.selectedProducto?.costo?.ultimoPrecioCompra || 0;
    const presentacion = this.selectedProducto.presentaciones?.[0];

    // Set original price for validation
    this.originalPrice = ultimoPrecio;
    this.clearPriceWarning();

    // Enable form controls
    this.enableFormControls();

    // Reset form with product data
    this.productSelectionFormGroup.patchValue({
      presentacion: presentacion,
      cantidad: 1,
      precioUnitario: ultimoPrecio,
      precioPorPresentacion: presentacion?.cantidad
        ? ultimoPrecio * presentacion.cantidad
        : 0,
      descuentoUnitario: 0,
      descuentoPorPresentacion: 0,
    });

    // Update computed properties
    this.updateComputedProperties();

    // Update search field with product description
    this.buscarProductoDirectoControl.setValue(
      `${this.selectedProducto?.id} - ${this.selectedProducto?.descripcion}`
    );

    // Load historical purchases for this product
    this.loadHistoricoCompras();

    // Focus on presentacion field after product is found
    setTimeout(() => {
      this.focusPresentacion();
    }, 100);

    // Update current pedido item for embedded components
    this.updateCurrentPedidoItemForEmbedded();
    
    // **FIX**: Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  onProductoProveedorSelectAndSwitchTab(productoProveedor: ProductoProveedor): void {
    this.onProductoProveedorSelect(productoProveedor);
    // Switch to first tab (Configurar Producto)
    this.selectedTabIndex = 0;
  }

  loadHistoricoCompras(): void {
    if (!this.selectedProducto?.id) return;

    this.isLoadingHistorico = true;
    this.cdr.markForCheck(); // Trigger change detection for loading state
    
    this.productoService
      .onGetProductoPorId(this.selectedProducto.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.historicoComprasDataSource.data =
            response.productoUltimasCompras || [];
          this.isLoadingHistorico = false;
          this.cdr.markForCheck(); // Trigger change detection when loading completes
        },
        error: () => {
          this.isLoadingHistorico = false;
          this.cdr.markForCheck(); // Trigger change detection on error
        },
      });
  }

  onAddProductToPedido(): void {
    if (!this.selectedProducto || this.productSelectionFormGroup.invalid) {
      this.notificacionService.openWarn("Complete todos los campos requeridos");
      return;
    }

    const formValue = this.productSelectionFormGroup.value;

    if (this.data.isEditing && this.data.pedidoItem) {
      // Update existing pedido item with step-aware logic
      this.updatePedidoItemForStep(formValue);
    } else {
      // Add new pedido item (always creates in DETALLES_PEDIDO step)
      this.createNewPedidoItem(formValue);
    }
  }

  private updatePedidoItemForStep(formValue: any): void {
    const pedidoItemData = this.data.pedidoItem;
    if (!pedidoItemData) return;

    // Create a full copy of the existing pedido item to preserve all data
    const pedidoItemForSave = new PedidoItem();
    Object.assign(pedidoItemForSave, pedidoItemData);
    
    // Only update the fields for the current estado - preserve all other fields
    if (this.data.pedido.estado === PedidoEstado.ABIERTO || this.data.pedido.estado === PedidoEstado.ACTIVO) {
      // Update Creation fields only
    pedidoItemForSave.presentacionCreacion = formValue.presentacion;
    pedidoItemForSave.cantidadCreacion = formValue.cantidad;
    pedidoItemForSave.precioUnitarioCreacion = formValue.precioUnitario;
    pedidoItemForSave.descuentoUnitarioCreacion = formValue.descuentoUnitario || 0;
    pedidoItemForSave.obsCreacion = formValue.obsCreacion || '';
    } else if (this.data.pedido.estado === PedidoEstado.EN_RECEPCION_NOTA) {
      // Update RecepcionNota fields only - preserve Creacion and RecepcionProducto fields
    pedidoItemForSave.presentacionRecepcionNota = formValue.presentacion;
    pedidoItemForSave.cantidadRecepcionNota = formValue.cantidad;
    pedidoItemForSave.precioUnitarioRecepcionNota = formValue.precioUnitario;
    pedidoItemForSave.descuentoUnitarioRecepcionNota = formValue.descuentoUnitario || 0;
    pedidoItemForSave.obsRecepcionNota = formValue.obsRecepcionNota || '';
      pedidoItemForSave.usuarioRecepcionNota = this.mainService.usuarioActual;
    } else if (this.data.pedido.estado === PedidoEstado.EN_RECEPCION_MERCADERIA) {
      // Update RecepcionProducto fields only - preserve Creacion and RecepcionNota fields
    pedidoItemForSave.presentacionRecepcionProducto = formValue.presentacion;
    pedidoItemForSave.cantidadRecepcionProducto = formValue.cantidad;
    pedidoItemForSave.precioUnitarioRecepcionProducto = formValue.precioUnitario;
    pedidoItemForSave.descuentoUnitarioRecepcionProducto = formValue.descuentoUnitario || 0;
    pedidoItemForSave.obsRecepcionProducto = formValue.obsRecepcionProducto || '';
    pedidoItemForSave.usuarioRecepcionProducto = this.mainService.usuarioActual;
    }

    // Mark that product configuration has changed
    this.markProductConfigurationChanged();

    // Check if distribution changes occurred for UI feedback
    const needsDistributionUpdate = this.detectDistributionChanges(formValue);
    if (needsDistributionUpdate) {
      this.changeTracker.needsDistributionUpdate = true;
    }
    
    this.pedidoService
      .onSaveItem(pedidoItemForSave.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.notificacionService.openSucess("Item actualizado exitosamente");
          
          // Mark that item was updated
          this.changeTracker.itemUpdated = true;
          
          if (needsDistributionUpdate) {
            // **STEP 1**: Update the main data reference with fresh database response
            if (this.data.pedidoItem) {
              Object.assign(this.data.pedidoItem, response);
            }
            
            // **STEP 2**: Create a proper PedidoItem instance from the fresh database response
            const updatedPedidoItem = new PedidoItem();
            Object.assign(updatedPedidoItem, response);
            
            // **STEP 3**: Get estado-based values from the fresh database response (not form values)
            const presentacion = updatedPedidoItem.getFieldValueForEstado('presentacion', this.data.pedido.estado);
            const cantidad = updatedPedidoItem.getFieldValueForEstado('cantidad', this.data.pedido.estado);
            const precioUnitario = updatedPedidoItem.getFieldValueForEstado('precioUnitario', this.data.pedido.estado);
            const descuentoUnitario = updatedPedidoItem.getFieldValueForEstado('descuentoUnitario', this.data.pedido.estado);
            
            // **STEP 4**: Update form with fresh data from database
            this.productSelectionFormGroup.patchValue({
              presentacion: presentacion,
              cantidad: cantidad,
              precioUnitario: precioUnitario,
              precioPorPresentacion: presentacion?.cantidad ? precioUnitario * presentacion.cantidad : 0,
              descuentoUnitario: descuentoUnitario || 0,
              descuentoPorPresentacion: presentacion?.cantidad ? (descuentoUnitario || 0) * presentacion.cantidad : 0,
            }, { emitEvent: false });
            
            // **STEP 5**: Recalculate totals based on fresh data
            this.calculateTotalPreview();
            
            // **STEP 6**: NOW update the embedded component with the fresh database data
            // This ensures the embedded component gets the correct presentacion and cantidad values
            this.updateCurrentPedidoItemForEmbedded();
            
            // **STEP 7**: Navigate to Distribución Sucursales tab (index 2)
            setTimeout(() => {
              this.selectedTabIndex = 2;
              this.notificacionService.openSucess("Diríjase a la pestaña 'Distribución Sucursales' para actualizar la distribución debido a los cambios realizados");
            }, 100);
          } else {
            // No distribution update needed, close dialog normally
            this.closeDialog({ 
              pedidoItem: response
            });
          }
        },
        error: () => {
          this.notificacionService.openWarn("Error al actualizar item del pedido");
        },
      });
  }

  private createNewPedidoItem(formValue: any): void {
    const pedidoItem = new PedidoItem();
    pedidoItem.pedido = this.data.pedido;
    pedidoItem.producto = this.selectedProducto;
    
    // Always create new items with Creacion fields
    pedidoItem.presentacionCreacion = formValue.presentacion;
    pedidoItem.cantidadCreacion = formValue.cantidad;
    pedidoItem.precioUnitarioCreacion = formValue.precioUnitario;
    pedidoItem.descuentoUnitarioCreacion = formValue.descuentoUnitario || 0;
    pedidoItem.obsCreacion = formValue.obsCreacion?.trim() || '';
    pedidoItem.valorTotal =
      formValue.cantidad *
      formValue.presentacion.cantidad *
      (formValue.precioUnitario - (formValue.descuentoUnitario || 0));
    pedidoItem.usuarioCreacion = this.mainService.usuarioActual;

    // Mark that a new item is being added
    this.changeTracker.itemAdded = true;
    this.markProductConfigurationChanged();

    // Use toInput() directly to avoid transient instance issues
    this.pedidoService
      .onSaveItem(pedidoItem.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.notificacionService.openSucess("Producto agregado al pedido");
          
          // **FIX**: Update data.pedidoItem with the fresh response from backend
          this.data.pedidoItem = response;
          this.data.isEditing = true; // Now we're in editing mode with a persisted item
          
          // **FIX**: Update the embedded component with the fresh database data
          // This ensures the Distribution tab gets the correct presentacion and cantidad values
          this.updateCurrentPedidoItemForEmbedded();
          
          // **FIX**: Navigate to Distribution Sucursales tab to allow distribution setup
          this.selectedTabIndex = 2;
          
          // **FIX**: Show helpful message to guide user
          this.notificacionService.openSucess("Producto agregado. Puede configurar la distribución por sucursales en esta pestaña.");
          
          // Force change detection to ensure UI updates
          this.cdr.markForCheck();
        },
        error: () => {
          this.notificacionService.openWarn("Error al agregar producto al pedido");
        },
      });
  }

  calculateTotalPreview(): void {
    // **PERFORMANCE**: Debounce calculation to prevent excessive calls during form changes
    this.calculateTotalPreviewDebounced();
  }

  private calculateTotalPreviewDebounced(): void {
    if (this.calculationTimeout) {
      clearTimeout(this.calculationTimeout);
    }
    
    this.calculationTimeout = setTimeout(() => {
      this.calculateTotalPreviewImmediate();
    }, 50); // 50ms debounce for smooth UX but reduced calculations
  }

  private calculateTotalPreviewImmediate(): void {
    const formValue = this.productSelectionFormGroup.value;
    if (
      !formValue.presentacion ||
      !formValue.cantidad ||
      formValue.precioUnitario === null
    ) {
      this.totalPreview = 0;
      this.totalDescuento = 0;
      this.cdr.markForCheck(); // Trigger change detection for OnPush
      return;
    }

    const cantidad = formValue.cantidad || 0;
    const presentacionCantidad = formValue.presentacion?.cantidad || 1;
    const precioUnitario = formValue.precioUnitario || 0;
    const descuentoUnitario = formValue.descuentoUnitario || 0;

    const subtotal = cantidad * presentacionCantidad * precioUnitario;
    this.totalDescuento = cantidad * presentacionCantidad * descuentoUnitario;
    this.totalPreview = subtotal - this.totalDescuento;
    
    // **PERFORMANCE**: Manually trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  clearAllSelections(): void {
    this.selectedProductoProveedor = null;
    this.selectedProducto = null;
    this.buscarProductoDirectoControl.reset();
    this.productSelectionFormGroup.reset();
    this.productSelectionFormGroup.patchValue({
      cantidad: 1,
      precioUnitario: 0,
      precioPorPresentacion: 0,
      descuentoUnitario: 0,
      descuentoPorPresentacion: 0,
    });
    // Disable form controls when no product is selected
    this.disableFormControls();
    this.historicoComprasDataSource.data = [];
    // Update computed properties
    this.updateComputedProperties();
  }

  clearProductSelection(): void {
    this.selectedProductoProveedor = null;
    this.selectedProducto = null;
    this.productSelectionFormGroup.reset();
    this.productSelectionFormGroup.patchValue({
      cantidad: 1,
      precioUnitario: 0,
      precioPorPresentacion: 0,
      descuentoUnitario: 0,
      descuentoPorPresentacion: 0,
    });
    // Disable form controls when no product is selected
    this.disableFormControls();
    this.historicoComprasDataSource.data = [];
    // Update computed properties
    this.updateComputedProperties();
  }

  // Pagination handlers
  onProductosProveedorPageChange(event: any): void {
    this.loadProductosProveedor(event.pageIndex, event.pageSize);
  }

  // Utility methods
  getMonedaSymbol(): string {
    return this.data.pedido?.moneda?.simbolo || "$";
  }

  /**
   * Centralized dialog close method that handles all situations
   * and tells the parent component whether it needs to refresh the UI or not
   */
  closeDialog(additionalData: Partial<AddProductDialogResult> = {}): void {
    // Determine if UI refresh is needed based on change tracker
    const needsUIRefresh = this.shouldRefreshUI();
    
    // Determine if this is a cancellation:
    // - If additionalData explicitly sets cancelled, use that
    // - Otherwise, it's a cancellation only if no modifications were made
    const isCancelled = additionalData.cancelled !== undefined 
      ? additionalData.cancelled 
      : !needsUIRefresh;
    
    // Create comprehensive result object
    const dialogResult: AddProductDialogResult = {
      // Basic operation results
      added: this.changeTracker.itemAdded,
      updated: this.changeTracker.itemUpdated,
      cancelled: isCancelled,
      
      // Change indicators
      productConfigurationChanged: this.changeTracker.productConfigurationChanged,
      sucursalDistributionChanged: this.changeTracker.sucursalDistributionChanged,
      rejectionStatusChanged: this.changeTracker.rejectionStatusChanged,
      itemCancellationChanged: this.changeTracker.itemCancellationChanged,
      needsDistributionUpdate: this.changeTracker.needsDistributionUpdate,
      
      // UI refresh indicator
      needsUIRefresh: needsUIRefresh,
      
      // Data objects
      pedidoItem: this.data.pedidoItem || additionalData.pedidoItem,
      step: this.currentStep,
      
      // Additional result data (excluding cancelled since we calculated it above)
      ...Object.fromEntries(Object.entries(additionalData).filter(([key]) => key !== 'cancelled'))
    };

    // Close dialog with comprehensive result
    this.dialogRef.close(dialogResult);
  }

  /**
   * Determines if the parent component should refresh its UI
   * based on the changes made in this dialog
   */
  private shouldRefreshUI(): boolean {
    return this.changeTracker.itemAdded ||
           this.changeTracker.itemUpdated ||
           this.changeTracker.productConfigurationChanged ||
           this.changeTracker.sucursalDistributionChanged ||
           this.changeTracker.rejectionStatusChanged ||
           this.changeTracker.itemCancellationChanged;
  }

  /**
   * Marks that product configuration has changed
   * (presentacion, cantidad, precio, descuento, observaciones)
   */
  private markProductConfigurationChanged(): void {
    this.changeTracker.productConfigurationChanged = true;
    this.hasModifications = true;
  }

  /**
   * Marks that sucursal distribution has changed
   */
  private markSucursalDistributionChanged(): void {
    this.changeTracker.sucursalDistributionChanged = true;
    this.hasModifications = true;
  }

  /**
   * Marks that rejection status has changed
   */
  private markRejectionStatusChanged(): void {
    this.changeTracker.rejectionStatusChanged = true;
    this.hasModifications = true;
  }

  /**
   * Marks that item cancellation status has changed
   */
  private markItemCancellationChanged(): void {
    this.changeTracker.itemCancellationChanged = true;
    this.hasModifications = true;
  }

  // Focus management methods
  focusBuscarProducto(): void {
    if (this.buscarProductoDirectoInput?.nativeElement) {
      this.buscarProductoDirectoInput.nativeElement.focus();
    }
  }

  focusPresentacion(): void {
    if (this.presentacionSelect) {
      this.presentacionSelect.focus();
      this.presentacionEnterCount = 0; // Reset counter
    }
  }

  focusCantidad(): void {
    if (this.cantidadInput?.nativeElement) {
      this.cantidadInput.nativeElement.focus();
      this.cantidadInput.nativeElement.select(); // Select all content
    }
  }

  focusPrecioUnitario(): void {
    if (this.precioUnitarioInput?.nativeElement) {
      this.precioUnitarioInput.nativeElement.focus();
      this.precioUnitarioInput.nativeElement.select(); // Select all content
    }
  }

  focusPrecioPorPresentacion(): void {
    if (this.precioPorPresentacionInput?.nativeElement) {
      this.precioPorPresentacionInput.nativeElement.focus();
      this.precioPorPresentacionInput.nativeElement.select(); // Select all content
    }
  }

  focusDescuentoUnitario(): void {
    if (this.descuentoUnitarioInput?.nativeElement) {
      this.descuentoUnitarioInput.nativeElement.focus();
      this.descuentoUnitarioInput.nativeElement.select(); // Select all content
    }
  }

  focusDescuentoPorPresentacion(): void {
    if (this.descuentoPorPresentacionInput?.nativeElement) {
      this.descuentoPorPresentacionInput.nativeElement.focus();
      this.descuentoPorPresentacionInput.nativeElement.select(); // Select all content
    }
  }

  focusAgregarButton(): void {
    if (this.agregarButton?._elementRef?.nativeElement) {
      this.agregarButton._elementRef.nativeElement.focus();
    }
  }

  // Enter key handlers
  onBuscarProductoEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.onSearchProductoDirecto();
    }
  }

  onPresentacionEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.presentacionEnterCount++;

      if (this.presentacionEnterCount === 1) {
        // First Enter: open the dropdown
        if (this.presentacionSelect && !this.presentacionSelect.panelOpen) {
          this.presentacionSelect.open();
        }
      } else if (this.presentacionEnterCount >= 2) {
        // Second Enter: close dropdown and move to next field
        if (this.presentacionSelect && this.presentacionSelect.panelOpen) {
          this.presentacionSelect.close();
        }
        setTimeout(() => {
          this.focusCantidad();
        }, 100);
      }
    }
  }

  onCantidadEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.focusPrecioPorPresentacion();
    }
  }

  onPrecioPorPresentacionEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.focusPrecioUnitario();
    }
  }

  onPrecioUnitarioEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.focusDescuentoPorPresentacion();
    }
  }

  onDescuentoPorPresentacionEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.focusDescuentoUnitario();
    }
  }

  onDescuentoUnitarioEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.focusAgregarButton();
    }
  }

  onAgregarButtonEnter(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.onAddProductToPedido();
    }
  }

  // Calculation methods
  private calculatePrecioPorPresentacion(): void {
    if (this.isCalculating) return;

    const precioUnitario =
      this.productSelectionFormGroup.get("precioUnitario")?.value || 0;
    const presentacion =
      this.productSelectionFormGroup.get("presentacion")?.value;

    if (presentacion?.cantidad) {
      this.isCalculating = true;
      const precioPorPresentacion = precioUnitario * presentacion.cantidad;
      this.productSelectionFormGroup
        .get("precioPorPresentacion")
        ?.setValue(precioPorPresentacion, { emitEvent: false });
      this.isCalculating = false;
      this.calculateTotalPreview();
    }
  }

  private calculatePrecioUnitario(): void {
    if (this.isCalculating) return;

    const precioPorPresentacion =
      this.productSelectionFormGroup.get("precioPorPresentacion")?.value || 0;
    const presentacion =
      this.productSelectionFormGroup.get("presentacion")?.value;

    if (presentacion?.cantidad && presentacion.cantidad > 0) {
      this.isCalculating = true;
      const precioUnitario = precioPorPresentacion / presentacion.cantidad;
      this.productSelectionFormGroup
        .get("precioUnitario")
        ?.setValue(precioUnitario, { emitEvent: false });
      this.isCalculating = false;
      this.calculateTotalPreview();
    }
  }

  private calculateDescuentoPorPresentacion(): void {
    if (this.isCalculating) return;

    const descuentoUnitario =
      this.productSelectionFormGroup.get("descuentoUnitario")?.value || 0;
    const presentacion =
      this.productSelectionFormGroup.get("presentacion")?.value;

    if (presentacion?.cantidad) {
      this.isCalculating = true;
      const descuentoPorPresentacion =
        descuentoUnitario * presentacion.cantidad;
      this.productSelectionFormGroup
        .get("descuentoPorPresentacion")
        ?.setValue(descuentoPorPresentacion, { emitEvent: false });
      this.isCalculating = false;
      this.calculateTotalPreview();
    }
  }

  private calculateDescuentoUnitario(): void {
    if (this.isCalculating) return;

    const descuentoPorPresentacion =
      this.productSelectionFormGroup.get("descuentoPorPresentacion")?.value ||
      0;
    const presentacion =
      this.productSelectionFormGroup.get("presentacion")?.value;

    if (presentacion?.cantidad && presentacion.cantidad > 0) {
      this.isCalculating = true;
      const descuentoUnitario =
        descuentoPorPresentacion / presentacion.cantidad;
      this.productSelectionFormGroup
        .get("descuentoUnitario")
        ?.setValue(descuentoUnitario, { emitEvent: false });
      this.isCalculating = false;
      this.calculateTotalPreview();
    }
  }

  // Price validation methods
  private validatePriceChange(): void {
    if (!this.originalPrice || this.originalPrice === 0) {
      this.clearPriceWarning();
      return;
    }

    const precioUnitario =
      this.productSelectionFormGroup.get("precioUnitario")?.value || 0;
    const descuentoUnitario =
      this.productSelectionFormGroup.get("descuentoUnitario")?.value || 0;
    const cleanPrecioUnitario = this.cleanCurrencyValue(precioUnitario);
    const cleanDescuentoUnitario = this.cleanCurrencyValue(descuentoUnitario);
    const netPrice = cleanPrecioUnitario - cleanDescuentoUnitario;
    const priceDifference = netPrice - this.originalPrice;
    const percentageChange = Math.abs(
      (priceDifference / this.originalPrice) * 100
    );

    this.priceChangePercentage = Math.round(percentageChange);

    if (netPrice > this.originalPrice) {
      this.priceChangeType = "higher";
      this.priceChangeMessage = `Precio ${this.priceChangePercentage}% más alto que el anterior`;
    } else if (netPrice < this.originalPrice) {
      this.priceChangeType = "lower";
      this.priceChangeMessage = `Precio ${this.priceChangePercentage}% más bajo que el anterior`;
    } else {
      this.clearPriceWarning();
      return;
    }

    this.showPriceWarning = true;

    // Show confirmation dialog for extreme changes (>100%)
    if (percentageChange > 100) {
      this.showExtremeChangedDialog(netPrice, percentageChange);
    }
  }

  private showExtremeChangedDialog(
    newPrice: number,
    percentageChange: number
  ): void {
    const changeType = newPrice > this.originalPrice ? "mayor" : "menor";
    const message = `El precio ingresado es ${Math.round(
      percentageChange
    )}% ${changeType} al precio anterior (Gs. ${this.originalPrice.toLocaleString()}). ¿Desea continuar?`;

    this.dialogosService
      .confirm("Cambio de precio extremo detectado", message)
      .subscribe((confirmed) => {
        if (!confirmed) {
          // Reset to original price if user doesn't want to continue
          this.productSelectionFormGroup
            .get("precioUnitario")
            ?.setValue(this.originalPrice, { emitEvent: false });
          this.clearPriceWarning();
        }
      });
  }

  private clearPriceWarning(): void {
    this.showPriceWarning = false;
    this.priceChangeMessage = "";
    this.priceChangeType = "none";
    this.priceChangePercentage = 0;
  }

  private validatePriceChangeFromPresentacion(): void {
    if (!this.originalPrice || this.originalPrice === 0) {
      this.clearPriceWarning();
      return;
    }

    const precioPorPresentacion =
      this.productSelectionFormGroup.get("precioPorPresentacion")?.value || 0;
    const descuentoPorPresentacion =
      this.productSelectionFormGroup.get("descuentoPorPresentacion")?.value ||
      0;
    const presentacion =
      this.productSelectionFormGroup.get("presentacion")?.value;
    if (!presentacion?.cantidad || presentacion.cantidad === 0) {
      this.clearPriceWarning();
      return;
    }

    // Convert presentacion price to unit price for comparison (considering discount)
    const cleanPresentacionPrice = this.cleanCurrencyValue(
      precioPorPresentacion
    );
    const cleanDescuentoPresentacion = this.cleanCurrencyValue(
      descuentoPorPresentacion
    );
    const netPresentacionPrice =
      cleanPresentacionPrice - cleanDescuentoPresentacion;
    const equivalentUnitPrice = netPresentacionPrice / presentacion.cantidad;
    const priceDifference = equivalentUnitPrice - this.originalPrice;
    const percentageChange = Math.abs(
      (priceDifference / this.originalPrice) * 100
    );

    this.priceChangePercentage = Math.round(percentageChange);

    if (equivalentUnitPrice > this.originalPrice) {
      this.priceChangeType = "higher";
      this.priceChangeMessage = `Precio ${this.priceChangePercentage}% más alto que el anterior`;
    } else if (equivalentUnitPrice < this.originalPrice) {
      this.priceChangeType = "lower";
      this.priceChangeMessage = `Precio ${this.priceChangePercentage}% más bajo que el anterior`;
    } else {
      this.clearPriceWarning();
      return;
    }

    this.showPriceWarning = true;

    // Show confirmation dialog for extreme changes (>100%)
    if (percentageChange > 100) {
      this.showExtremeChangedDialog(equivalentUnitPrice, percentageChange);
    }
  }

  private cleanCurrencyValue(value: any): number {
    if (typeof value === "string") {
      // Remove currency symbols, spaces, and convert comma to dot
      return parseFloat(value.replace(/[^\d,-]/g, "").replace(",", ".")) || 0;
    }
    return parseFloat(value) || 0;
  }

  private loadPedidoItemForEditing(): void {
    const pedidoItemData = this.data.pedidoItem;
    if (!pedidoItemData) {
      return;
    }

    // if data.pedido is not null, then set the pedidoItem.pedido to data.pedido
    if (this.data.pedido) {
      pedidoItemData.pedido = this.data.pedido;
    }

    // Create a proper PedidoItem instance from the data
    const pedidoItem = new PedidoItem();
    Object.assign(pedidoItem, pedidoItemData);

    // Set the selected product - but we need to make sure it has presentaciones loaded
    this.selectedProducto = pedidoItem.producto;
    this.selectedProductoProveedor = null; // Clear proveedor selection since this is direct editing

    // Check if product has presentaciones loaded
    if (!this.selectedProducto?.presentaciones || this.selectedProducto.presentaciones.length === 0) {
      // **FIX**: Trigger loading state and change detection
      this.isLoadingProductos = true;
      this.cdr.markForCheck();
      
      // Load product with presentaciones from service
      this.productoService.getProducto(this.selectedProducto.id)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (fullProduct) => {
            this.selectedProducto = fullProduct;
            this.isLoadingProductos = false;
            this.continueLoadingPedidoItem(pedidoItem);
          },
          error: (error) => {
            console.error('❌ [AddProductDialog] Error loading product:', error);
            this.isLoadingProductos = false;
            this.notificacionService.openWarn('Error al cargar datos del producto');
            // Continue with existing data anyway
            this.continueLoadingPedidoItem(pedidoItem);
          }
        });
    } else {
      // Product already has presentaciones, continue directly
      this.continueLoadingPedidoItem(pedidoItem);
    }
  }

  private continueLoadingPedidoItem(pedidoItem: PedidoItem): void {
    // Get step-appropriate values using the helper methods
    const presentacion = pedidoItem.getFieldValueForEstado('presentacion', this.data.pedido.estado);
    const cantidad = pedidoItem.getFieldValueForEstado('cantidad', this.data.pedido.estado);
    const precioUnitario = pedidoItem.getFieldValueForEstado('precioUnitario', this.data.pedido.estado);
    const descuentoUnitario = pedidoItem.getFieldValueForEstado('descuentoUnitario', this.data.pedido.estado);
    const vencimiento = pedidoItem.getFieldValueForEstado('vencimiento', this.data.pedido.estado);
    const observaciones = pedidoItem.getFieldValueForEstado('obs', this.data.pedido.estado);

    // Find the matching presentacion from selectedProducto.presentaciones for proper mat-select binding
    // This ensures object identity matching for Angular mat-select
    const matchingPresentacion = presentacion && this.selectedProducto?.presentaciones
      ? this.selectedProducto.presentaciones.find(p => p.id === presentacion.id)
      : presentacion;

    // Store original values for change detection
    this.originalPresentacionId = presentacion?.id || null;
    this.originalCantidad = cantidad;

    // Set original price for validation
    this.originalPrice = precioUnitario || 0;
    this.clearPriceWarning();

    // Enable form controls
    this.enableFormControls();

    // Load form with pedido item data
    this.productSelectionFormGroup.patchValue({
      presentacion: matchingPresentacion,
      cantidad: cantidad,
      precioUnitario: precioUnitario,
      precioPorPresentacion: matchingPresentacion?.cantidad ? precioUnitario * matchingPresentacion.cantidad : 0,
      descuentoUnitario: descuentoUnitario || 0,
      descuentoPorPresentacion: matchingPresentacion?.cantidad ? (descuentoUnitario || 0) * matchingPresentacion.cantidad : 0,
      obsCreacion: pedidoItem.obsCreacion || '',
      obsRecepcionNota: pedidoItem.obsRecepcionNota || '',
      obsRecepcionProducto: pedidoItem.obsRecepcionProducto || ''
    });

    // **FIX**: Calculate total preview after loading data
    this.calculateTotalPreview();

    // Update computed properties
    this.updateComputedProperties();

    // Update search field with product description
    this.buscarProductoDirectoControl.setValue(
      `${pedidoItem.producto?.id} - ${pedidoItem.producto?.descripcion}`
    );

    // Load historical purchases for this product
    this.loadHistoricoCompras();
    
    // Update current pedido item for embedded components
    this.updateCurrentPedidoItemForEmbedded();
    
    // **CRITICAL FIX**: Manually trigger change detection for OnPush strategy after all data is loaded
    this.cdr.markForCheck();
  }

  // Helper methods for enabling/disabling form controls
  private enableFormControls(): void {
    // **NEW**: Don't enable any controls if in read-only mode
    if (this.isReadOnlyMode) {
      this.disableFormControls();
      return;
    }
    
    this.productSelectionFormGroup.get("presentacion")?.enable();
    this.productSelectionFormGroup.get("cantidad")?.enable();
    this.productSelectionFormGroup.get("precioUnitario")?.enable();
    this.productSelectionFormGroup.get("precioPorPresentacion")?.enable();
    this.productSelectionFormGroup.get("descuentoUnitario")?.enable();
    this.productSelectionFormGroup.get("descuentoPorPresentacion")?.enable();
    
    // First disable all observation fields, then enable the appropriate one
    this.productSelectionFormGroup.get("obsCreacion")?.disable();
    this.productSelectionFormGroup.get("obsRecepcionNota")?.disable();
    this.productSelectionFormGroup.get("obsRecepcionProducto")?.disable();
    
    // Enable appropriate observations field based on pedido estado
    if (this.data.pedido?.estado === PedidoEstado.ABIERTO || this.data.pedido?.estado === PedidoEstado.ACTIVO) {
      this.productSelectionFormGroup.get("obsCreacion")?.enable();
    } else if (this.data.pedido?.estado === PedidoEstado.EN_RECEPCION_NOTA) {
      this.productSelectionFormGroup.get("obsRecepcionNota")?.enable();
      // Keep obsCreacion as read-only for reference - do not enable
    } else if (this.data.pedido?.estado === PedidoEstado.EN_RECEPCION_MERCADERIA) {
      this.productSelectionFormGroup.get("obsRecepcionProducto")?.enable();
      // Keep previous step obs as read-only for reference - do not enable
    }
    
    // **CRITICAL**: Trigger change detection after enabling controls for OnPush strategy
    this.cdr.markForCheck();
  }

  private disableFormControls(): void {
    this.productSelectionFormGroup.get("presentacion")?.disable();
    this.productSelectionFormGroup.get("cantidad")?.disable();
    this.productSelectionFormGroup.get("precioUnitario")?.disable();
    this.productSelectionFormGroup.get("precioPorPresentacion")?.disable();
    this.productSelectionFormGroup.get("descuentoUnitario")?.disable();
    this.productSelectionFormGroup.get("descuentoPorPresentacion")?.disable();
    this.productSelectionFormGroup.get("obsCreacion")?.disable();
    this.productSelectionFormGroup.get("obsRecepcionNota")?.disable();
    this.productSelectionFormGroup.get("obsRecepcionProducto")?.disable();
  }

  private detectDistributionChanges(formValue: any): boolean {
    if (!this.data.isEditing) {
      return false; // No need to check for new items
    }

    const currentPresentacionId = formValue.presentacion?.id || null;
    const currentCantidad = formValue.cantidad || null;

    return currentPresentacionId !== this.originalPresentacionId || 
           currentCantidad !== this.originalCantidad;
  }

  // Helper method to update the current pedido item for embedded components
  private updateCurrentPedidoItemForEmbedded(): void {
    if (this.data.pedidoItem) {
      // Always create a new PedidoItem instance to ensure Angular change detection triggers
      const pedidoItem = new PedidoItem();
      Object.assign(pedidoItem, this.data.pedidoItem);
      
      // **CRITICAL**: Ensure the pedido reference is set correctly
      if (this.data.pedido) {
        pedidoItem.pedido = this.data.pedido;
      }
      
      this.currentPedidoItemForEmbedded = pedidoItem;
    } else if (this.selectedProducto && !this.data.isEditing) {
      // If no pedido item exists but we have a selected product, create a temporary one
      const tempItem = new PedidoItem();
      tempItem.producto = this.selectedProducto;
      tempItem.pedido = this.data.pedido;
      
      // Set fields based on form values
      const formValue = this.productSelectionFormGroup.value;
      
      // Set all fields to preserve data across estados
      if (this.data.pedido.estado === PedidoEstado.ABIERTO || this.data.pedido.estado === PedidoEstado.ACTIVO) {
        tempItem.presentacionCreacion = formValue.presentacion;
        tempItem.cantidadCreacion = formValue.cantidad || 1;
        tempItem.precioUnitarioCreacion = formValue.precioUnitario || 0;
        tempItem.descuentoUnitarioCreacion = formValue.descuentoUnitario || 0;
        tempItem.obsCreacion = formValue.obsCreacion || '';
      } else if (this.data.pedido.estado === PedidoEstado.EN_RECEPCION_NOTA) {
        tempItem.presentacionRecepcionNota = formValue.presentacion;
        tempItem.cantidadRecepcionNota = formValue.cantidad || 1;
        tempItem.precioUnitarioRecepcionNota = formValue.precioUnitario || 0;
        tempItem.descuentoUnitarioRecepcionNota = formValue.descuentoUnitario || 0;
        tempItem.obsRecepcionNota = formValue.obsRecepcionNota || '';
      } else if (this.data.pedido.estado === PedidoEstado.EN_RECEPCION_MERCADERIA) {
        tempItem.presentacionRecepcionProducto = formValue.presentacion;
        tempItem.cantidadRecepcionProducto = formValue.cantidad || 1;
        tempItem.precioUnitarioRecepcionProducto = formValue.precioUnitario || 0;
        tempItem.descuentoUnitarioRecepcionProducto = formValue.descuentoUnitario || 0;
        tempItem.obsRecepcionProducto = formValue.obsRecepcionProducto || '';
      }
      
      tempItem.usuarioCreacion = this.mainService.usuarioActual;
      this.currentPedidoItemForEmbedded = tempItem;
    } else {
      this.currentPedidoItemForEmbedded = null;
    }
  }

  // Handle automatic updates from two-way binding
  onPedidoItemChanged(): void {
    if (this.currentPedidoItemForEmbedded && this.data.isEditing) {
      // Update the main data reference
      if (this.data.pedidoItem) {
        Object.assign(this.data.pedidoItem, this.currentPedidoItemForEmbedded);
      }
      
      // Get the values for the current estado from the pedido item
      const updatedQuantity = this.currentPedidoItemForEmbedded.getFieldValueForEstado('cantidad', this.data.pedido.estado);
      const updatedPresentacion = this.currentPedidoItemForEmbedded.getFieldValueForEstado('presentacion', this.data.pedido.estado);
      const updatedPrecioUnitario = this.currentPedidoItemForEmbedded.getFieldValueForEstado('precioUnitario', this.data.pedido.estado);
      const updatedDescuentoUnitario = this.currentPedidoItemForEmbedded.getFieldValueForEstado('descuentoUnitario', this.data.pedido.estado);
      
      // Update form with the changed values
      this.productSelectionFormGroup.patchValue({
        cantidad: updatedQuantity,
        presentacion: updatedPresentacion,
        precioUnitario: updatedPrecioUnitario,
        precioPorPresentacion: updatedPresentacion?.cantidad ? updatedPrecioUnitario * updatedPresentacion.cantidad : 0,
        descuentoUnitario: updatedDescuentoUnitario || 0,
        descuentoPorPresentacion: updatedPresentacion?.cantidad ? (updatedDescuentoUnitario || 0) * updatedPresentacion.cantidad : 0,
      }, { emitEvent: false }); // Don't emit to avoid infinite loop
      
      // Recalculate totals
      this.calculateTotalPreview();
      
      // Update computed properties to reflect any status changes (like cancelado)
      this.updateComputedProperties();
    }
  }

  // Event handlers for embedded components
  onSucursalDistributionSaved(event: any): void {
    // Handle sucursal distribution save event
    if (event && this.currentPedidoItemForEmbedded) {
      // Update the current pedido item with the saved distribution data
      this.currentPedidoItemForEmbedded.pedidoItemSucursalList = event.pedidoItemSucursalList || [];
      
      // Mark that sucursal distribution has changed
      this.markSucursalDistributionChanged();
      
      // Trigger change detection
      this.onPedidoItemChanged();
      
      // Show success message
      this.notificacionService.openSucess('Distribución por sucursal guardada exitosamente');
    }
  }

  onSucursalDistributionCancelled(): void {
    // Handle sucursal distribution cancel event
    // No specific action needed, just log for debugging
    this.closeDialog();
  }

  onRejectionStatusSaved(event: any): void {
    // Handle rejection status save event
    if (event && this.currentPedidoItemForEmbedded) {
      // Track if cancellation status changed
      const previousCancelado = this.currentPedidoItemForEmbedded.cancelado;
      
      // Update the current pedido item with the saved rejection data
      // Use the appropriate rejection motivo field based on current pedido estado
      if (this.data.pedido?.estado === PedidoEstado.EN_RECEPCION_NOTA) {
        if (event.motivoRechazoRecepcionNota !== undefined) {
          this.currentPedidoItemForEmbedded.motivoRechazoRecepcionNota = event.motivoRechazoRecepcionNota;
        }
        if (event.obsRecepcionNota !== undefined) {
          this.currentPedidoItemForEmbedded.obsRecepcionNota = event.obsRecepcionNota;
        }
        if (event.cancelado !== undefined) {
          this.currentPedidoItemForEmbedded.cancelado = event.cancelado;
        }
      } else if (this.data.pedido?.estado === PedidoEstado.EN_RECEPCION_MERCADERIA) {
        if (event.motivoRechazoRecepcionProducto !== undefined) {
          this.currentPedidoItemForEmbedded.motivoRechazoRecepcionProducto = event.motivoRechazoRecepcionProducto;
        }
        if (event.cancelado !== undefined) {
          this.currentPedidoItemForEmbedded.cancelado = event.cancelado;
        }
      }
      
      // Mark changes appropriately
      this.markRejectionStatusChanged();
      
      // Check if cancellation status changed
      if (previousCancelado !== this.currentPedidoItemForEmbedded.cancelado) {
        this.markItemCancellationChanged();
      }
      
      // Trigger change detection
      this.onPedidoItemChanged();
      
      // Show success message
      this.notificacionService.openSucess('Estado de rechazo guardado exitosamente');
    }
  }

  onRejectionStatusCancelled(): void {
    // Handle rejection status cancel event
    // Close dialog - let closeDialog() determine if modifications were made
    this.closeDialog();
  }

  onRepeatFromHistoryAndSwitchTab(compraItem: any): void {
    this.onRepeatFromHistory(compraItem);
    this.selectedTabIndex = 0;
  }

  onRepeatFromHistory(compraItem: any): void {
    this.productSelectionFormGroup.patchValue({
      cantidad: compraItem.cantidad,
      precioUnitario: compraItem.precio,
      descuentoUnitario: 0,
    });
  }

  // Helper method for mat-select compareWith to properly compare presentacion objects
  comparePresentaciones(p1: any, p2: any): boolean {
    return p1 && p2 ? p1.id === p2.id : p1 === p2;
  }

  // Method to update computed properties for template usage
  private updateComputedProperties(): void {
    // **PERFORMANCE**: Debounce update to prevent excessive calls
    this.updateComputedPropertiesDebounced();
  }

  private updateComputedPropertiesDebounced(): void {
    if (this.updateComputedPropertiesTimeout) {
      clearTimeout(this.updateComputedPropertiesTimeout);
    }
    
    this.updateComputedPropertiesTimeout = setTimeout(() => {
      this.updateComputedPropertiesImmediate();
    }, 10); // 10ms debounce - shorter delay since this affects UI state
  }

  private updateComputedPropertiesImmediate(): void {
    // **OPTIMIZED**: Cache estado for reuse
    const pedidoEstado = this.data?.pedido?.estado;
    

    
    // Map pedido estado to PedidoStep for template compatibility
    if (!pedidoEstado) {
      this.currentStep = PedidoStep.DETALLES_PEDIDO;
    } else {
      // **OPTIMIZED**: Use cached estado
      switch (pedidoEstado) {
        case PedidoEstado.ABIERTO:
        case PedidoEstado.ACTIVO:
          this.currentStep = PedidoStep.DETALLES_PEDIDO;
          break;
        case PedidoEstado.EN_RECEPCION_NOTA:
          this.currentStep = PedidoStep.RECEPCION_NOTA;
          break;
        case PedidoEstado.EN_RECEPCION_MERCADERIA:
        case PedidoEstado.CONCLUIDO:
          this.currentStep = PedidoStep.RECEPCION_PRODUCTO;
          break;
        default:
          this.currentStep = PedidoStep.DETALLES_PEDIDO;
      }
    }

    // **OPTIMIZED**: Update step flags in batch
    this.isDetallesPedidoStep = this.currentStep === PedidoStep.DETALLES_PEDIDO;
    this.isRecepcionNotaStep = this.currentStep === PedidoStep.RECEPCION_NOTA;
    this.isRecepcionProductoStep = this.currentStep === PedidoStep.RECEPCION_PRODUCTO;

    // Update other computed properties
    this.canModifyInCurrentStep = !this.isReadOnlyMode && (this.currentStep !== PedidoStep.DETALLES_PEDIDO || !this.data.isEditing);
    
    // **OPTIMIZED**: Use lookup for step display names
    const stepDisplayNames = {
      [PedidoStep.DETALLES_PEDIDO]: 'Detalles del Pedido',
      [PedidoStep.RECEPCION_NOTA]: 'Recepción de Nota',
      [PedidoStep.RECEPCION_PRODUCTO]: 'Recepción de Producto'
    };
    this.currentStepDisplayName = stepDisplayNames[this.currentStep] || 'Desconocido';

    // Update form validation
    this.isFormInvalidOrNoProduct = this.productSelectionFormGroup.invalid || !this.selectedProducto;
    
    // Check if item is canceled
    this.isItemCanceled = this.data.isEditing && this.data.pedidoItem?.cancelado === true;
    
    // **PERFORMANCE**: Manually trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }
}
