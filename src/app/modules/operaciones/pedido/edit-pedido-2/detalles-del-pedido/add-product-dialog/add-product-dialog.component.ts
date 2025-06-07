import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
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
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-add-product-dialog",
  templateUrl: "./add-product-dialog.component.html",
  styleUrls: ["./add-product-dialog.component.scss"],
})
export class AddProductDialogComponent implements OnInit, AfterViewInit {
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

  // Step context
  currentStep: PedidoStep = PedidoStep.DETALLES_PEDIDO;
  
  // Modification tracking
  hasModifications = false;

  constructor(
    public dialogRef: MatDialogRef<AddProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddProductDialogData,
    private productoProveedorService: ProductoProveedorService,
    private pedidoService: PedidoService,
    private productoService: ProductoService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private dialogosService: DialogosService
  ) {}

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.loadProductosProveedor();
    
    // Set current step context
    this.currentStep = this.data.currentStep || PedidoStep.DETALLES_PEDIDO;

    // If editing an existing item, load its data
    if (this.data.isEditing && this.data.pedidoItem) {
      this.loadPedidoItemForEditing();
    }
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

    // Calculate total when form values change
    this.productSelectionFormGroup.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.calculateTotalPreview();
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
    const texto = this.buscarProductoControl.value || "";

    this.productoProveedorService
      .getByProveedorId(this.data.pedido.proveedor.id, texto, page, size)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.productosProveedorPage = response;
          this.productosProveedorDataSource.data = response.getContent;
          this.isLoadingProductos = false;
        },
        error: () => {
          this.isLoadingProductos = false;
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
        console.log("response", response);

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
  }

  loadHistoricoCompras(): void {
    if (!this.selectedProducto?.id) return;

    this.isLoadingHistorico = true;
    this.productoService
      .onGetProductoPorId(this.selectedProducto.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.historicoComprasDataSource.data =
            response.productoUltimasCompras || [];
          this.isLoadingHistorico = false;
        },
        error: () => {
          this.isLoadingHistorico = false;
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

    // Create a proper PedidoItem instance from the data
    const pedidoItem = new PedidoItem();
    Object.assign(pedidoItem, pedidoItemData);

    // For RecepcionNota step: if this is the first time editing, copy Creacion data first
    if (this.currentStep === PedidoStep.RECEPCION_NOTA) {
      const hasRecepcionNotaData = pedidoItem.precioUnitarioRecepcionNota !== null && 
                                   pedidoItem.precioUnitarioRecepcionNota !== undefined;
      
      if (!hasRecepcionNotaData) {
        // Copy creation data to RecepcionNota fields before applying user changes
        pedidoItem.copyStepValues(PedidoStep.DETALLES_PEDIDO, PedidoStep.RECEPCION_NOTA);
      }
    }

    // For RecepcionProducto step: if this is the first time editing, copy previous step data first  
    if (this.currentStep === PedidoStep.RECEPCION_PRODUCTO) {
      const hasRecepcionProductoData = pedidoItem.precioUnitarioRecepcionProducto !== null && 
                                       pedidoItem.precioUnitarioRecepcionProducto !== undefined;
      
      if (!hasRecepcionProductoData) {
        // Try to copy from RecepcionNota first, fallback to Creacion
        const hasRecepcionNotaData = pedidoItem.precioUnitarioRecepcionNota !== null && 
                                     pedidoItem.precioUnitarioRecepcionNota !== undefined;
        
        if (hasRecepcionNotaData) {
          pedidoItem.copyStepValues(PedidoStep.RECEPCION_NOTA, PedidoStep.RECEPCION_PRODUCTO);
        } else {
          pedidoItem.copyStepValues(PedidoStep.DETALLES_PEDIDO, PedidoStep.RECEPCION_PRODUCTO);
        }
      }
    }

    // Set the appropriate step values (user's changes)
    pedidoItem.setFieldValueForStep('presentacion', formValue.presentacion, this.currentStep);
    pedidoItem.setFieldValueForStep('cantidad', formValue.cantidad, this.currentStep);
    pedidoItem.setFieldValueForStep('precioUnitario', formValue.precioUnitario, this.currentStep);
    pedidoItem.setFieldValueForStep('descuentoUnitario', formValue.descuentoUnitario || 0, this.currentStep);
    
    // Set step-specific user and modification tracking
    if (this.currentStep === PedidoStep.RECEPCION_NOTA) {
      pedidoItem.usuarioRecepcionNota = this.mainService.usuarioActual;
      
      // Check if modifications were made
      const modificationsDetected = this.detectModifications(formValue);
      if (modificationsDetected) {
        pedidoItem.motivoModificacionRecepcionNota = this.getModificationReason(formValue);
      }
    } else if (this.currentStep === PedidoStep.RECEPCION_PRODUCTO) {
      pedidoItem.usuarioRecepcionProducto = this.mainService.usuarioActual;
      
      // Check if modifications were made
      const modificationsDetected = this.detectModifications(formValue);
      if (modificationsDetected) {
        pedidoItem.motivoModificacionRecepcionProducto = this.getModificationReason(formValue);
      }
    }

    // Calculate total based on current step values
    const currentPresentacion = pedidoItem.getFieldValueForStep('presentacion', this.currentStep);
    const currentCantidad = pedidoItem.getFieldValueForStep('cantidad', this.currentStep);
    const currentPrecio = pedidoItem.getFieldValueForStep('precioUnitario', this.currentStep);
    const currentDescuento = pedidoItem.getFieldValueForStep('descuentoUnitario', this.currentStep);
    
    pedidoItem.valorTotal = 
      currentCantidad * 
      currentPresentacion.cantidad * 
      (currentPrecio - (currentDescuento || 0));

    // Save the updated item
    let pedidoAux = new PedidoItem();
    Object.assign(pedidoAux, pedidoItem);
    
    this.pedidoService
      .onSaveItem(pedidoAux.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.notificacionService.openSucess("Item actualizado exitosamente");
          this.dialogRef.close({ updated: true, pedidoItem: response, step: this.currentStep });
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
    pedidoItem.valorTotal =
      formValue.cantidad *
      formValue.presentacion.cantidad *
      (formValue.precioUnitario - (formValue.descuentoUnitario || 0));
    pedidoItem.usuarioCreacion = this.mainService.usuarioActual;

    let pedidoAux = new PedidoItem();
    Object.assign(pedidoAux, pedidoItem);
    
    this.pedidoService
      .onSaveItem(pedidoAux.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.notificacionService.openSucess("Producto agregado al pedido");
          this.dialogRef.close({ added: true, pedidoItem: response, step: this.currentStep });
        },
        error: () => {
          this.notificacionService.openWarn("Error al agregar producto al pedido");
        },
      });
  }

  private detectModifications(formValue: any): boolean {
    if (!this.data.pedidoItem) return false;
    
    // Create a proper PedidoItem instance from the data
    const pedidoItem = new PedidoItem();
    Object.assign(pedidoItem, this.data.pedidoItem);
    
    // Get previous step values for comparison
    let previousStep: PedidoStep;
    if (this.currentStep === PedidoStep.RECEPCION_PRODUCTO) {
      previousStep = PedidoStep.RECEPCION_NOTA;
    } else if (this.currentStep === PedidoStep.RECEPCION_NOTA) {
      previousStep = PedidoStep.DETALLES_PEDIDO;
    } else {
      return false; // No previous step to compare
    }
    
    const previousPresentacion = pedidoItem.getFieldValueForStep('presentacion', previousStep);
    const previousCantidad = pedidoItem.getFieldValueForStep('cantidad', previousStep);
    const previousPrecio = pedidoItem.getFieldValueForStep('precioUnitario', previousStep);
    const previousDescuento = pedidoItem.getFieldValueForStep('descuentoUnitario', previousStep);
    
    return (
      formValue.presentacion?.id !== previousPresentacion?.id ||
      formValue.cantidad !== previousCantidad ||
      formValue.precioUnitario !== previousPrecio ||
      (formValue.descuentoUnitario || 0) !== (previousDescuento || 0)
    );
  }

  private getModificationReason(formValue: any): string {
    // This could be enhanced to automatically detect the specific type of modification
    // For now, return a generic message or prompt user for specific reason
    return 'MODIFICACION_EN_RECEPCION'; // Could be enhanced with more specific logic
  }

  // Method to determine if current step allows modifications
  get canModifyInCurrentStep(): boolean {
    return this.currentStep !== PedidoStep.DETALLES_PEDIDO || !this.data.isEditing;
  }

  // Method to get step display name for UI
  get currentStepDisplayName(): string {
    switch (this.currentStep) {
      case PedidoStep.DETALLES_PEDIDO:
        return 'Detalles del Pedido';
      case PedidoStep.RECEPCION_NOTA:
        return 'Recepción de Nota';
      case PedidoStep.RECEPCION_PRODUCTO:
        return 'Recepción de Producto';
      default:
        return 'Desconocido';
    }
  }

  calculateTotalPreview(): void {
    const formValue = this.productSelectionFormGroup.value;
    if (
      !formValue.presentacion ||
      !formValue.cantidad ||
      formValue.precioUnitario === null
    ) {
      this.totalPreview = 0;
      this.totalDescuento = 0;
      return;
    }

    const cantidad = formValue.cantidad || 0;
    const presentacionCantidad = formValue.presentacion?.cantidad || 1;
    const precioUnitario = formValue.precioUnitario || 0;
    const descuentoUnitario = formValue.descuentoUnitario || 0;

    const subtotal = cantidad * presentacionCantidad * precioUnitario;
    this.totalDescuento = cantidad * presentacionCantidad * descuentoUnitario;
    this.totalPreview = subtotal - this.totalDescuento;
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
  }

  // Pagination handlers
  onProductosProveedorPageChange(event: any): void {
    this.loadProductosProveedor(event.pageIndex, event.pageSize);
  }

  // Utility methods
  getMonedaSymbol(): string {
    return this.data.pedido?.moneda?.simbolo || "$";
  }

  onCancel(): void {
    this.dialogRef.close({ added: false });
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
    if (!pedidoItemData) return;

    // Create a proper PedidoItem instance from the data
    const pedidoItem = new PedidoItem();
    Object.assign(pedidoItem, pedidoItemData);

    // Set the selected product
    this.selectedProducto = pedidoItem.producto;
    this.selectedProductoProveedor = null; // Clear proveedor selection since this is direct editing

    // Get step-appropriate values using the helper methods
    const presentacion = pedidoItem.getFieldValueForStep('presentacion', this.currentStep);
    const cantidad = pedidoItem.getFieldValueForStep('cantidad', this.currentStep);
    const precioUnitario = pedidoItem.getFieldValueForStep('precioUnitario', this.currentStep);
    const descuentoUnitario = pedidoItem.getFieldValueForStep('descuentoUnitario', this.currentStep);
    const vencimiento = pedidoItem.getFieldValueForStep('vencimiento', this.currentStep);

    // Set original price for validation - always use the creation price as baseline
    this.originalPrice = pedidoItem.precioUnitarioCreacion || 0;
    this.clearPriceWarning();

    // Enable form controls
    this.enableFormControls();

    // Load the form with step-appropriate data
    this.productSelectionFormGroup.patchValue({
      presentacion: presentacion,
      cantidad: cantidad,
      precioUnitario: precioUnitario,
      precioPorPresentacion: presentacion?.cantidad
        ? (precioUnitario || 0) * presentacion.cantidad
        : 0,
      descuentoUnitario: descuentoUnitario || 0,
      descuentoPorPresentacion: presentacion?.cantidad
        ? (descuentoUnitario || 0) * presentacion.cantidad
        : 0,
    });

    // Update search field with product description
    this.buscarProductoDirectoControl.setValue(
      `${this.selectedProducto?.id} - ${this.selectedProducto?.descripcion}`
    );

    // Load historical purchases for this product
    this.loadHistoricoCompras();
    
    // Track if we're showing data from a different step (indicating potential modifications)
    this.trackModificationStatus();
  }

  private trackModificationStatus(): void {
    if (!this.data.pedidoItem) return;
    
    // Create a proper PedidoItem instance from the data
    const pedidoItem = new PedidoItem();
    Object.assign(pedidoItem, this.data.pedidoItem);
    
    // Check if current step has modifications compared to previous steps
    this.hasModifications = pedidoItem.hasModificationsInStep(this.currentStep);
  }

  // Helper methods for enabling/disabling form controls
  private enableFormControls(): void {
    this.productSelectionFormGroup.get("presentacion")?.enable();
    this.productSelectionFormGroup.get("cantidad")?.enable();
    this.productSelectionFormGroup.get("precioUnitario")?.enable();
    this.productSelectionFormGroup.get("precioPorPresentacion")?.enable();
    this.productSelectionFormGroup.get("descuentoUnitario")?.enable();
    this.productSelectionFormGroup.get("descuentoPorPresentacion")?.enable();
  }

  private disableFormControls(): void {
    this.productSelectionFormGroup.get("presentacion")?.disable();
    this.productSelectionFormGroup.get("cantidad")?.disable();
    this.productSelectionFormGroup.get("precioUnitario")?.disable();
    this.productSelectionFormGroup.get("precioPorPresentacion")?.disable();
    this.productSelectionFormGroup.get("descuentoUnitario")?.disable();
    this.productSelectionFormGroup.get("descuentoPorPresentacion")?.disable();
  }

  // Getter for form validity check (to replace template disabled binding)
  get isFormInvalidOrNoProduct(): boolean {
    return this.productSelectionFormGroup.invalid || !this.selectedProducto;
  }

  onRepeatFromHistory(compraItem: any): void {
    // Fill form with historical data
    this.productSelectionFormGroup.patchValue({
      cantidad: compraItem.cantidad,
      precioUnitario: compraItem.precio,
      descuentoUnitario: 0,
    });
  }
}
