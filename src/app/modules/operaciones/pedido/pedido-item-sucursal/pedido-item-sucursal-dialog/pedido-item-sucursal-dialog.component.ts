import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit, QueryList, ViewChildren, Input, Output, EventEmitter, Optional, OnChanges, SimpleChanges } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSelect } from "@angular/material/select";
import { PedidoItem, PedidoStep } from "../../edit-pedido/pedido-item.model";
import { PedidoEstado } from "../../edit-pedido/pedido-enums";
import { Sucursal } from "../../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../../empresarial/sucursal/sucursal.service";
import { MovimientoStockService } from "../../../movimiento-stock/movimiento-stock.service";
import { dateToString } from "../../../../../commons/core/utils/dateUtils";
import { TipoMovimiento } from "../../../movimiento-stock/movimiento-stock.enums";
import { PedidoItemSucursalService } from "../pedido-item-sucursal.service";
import { MainService } from "../../../../../main.service";
import { PedidoItemSucursal, PedidoItemSucursalInput } from "../pedido-item-sucursal.model";
import { NotificacionColor, NotificacionSnackbarService } from "../../../../../notificacion-snackbar.service";
import { Observable, forkJoin } from "rxjs";
import { DialogosService } from "../../../../../shared/components/dialogos/dialogos.service";
import { PedidoService } from "../../pedido.service";
import { MatButton } from "@angular/material/button";

@Component({
  selector: "app-pedido-item-sucursal-dialog",
  templateUrl: "./pedido-item-sucursal-dialog.component.html",
  styleUrls: ["./pedido-item-sucursal-dialog.component.scss"],
})
export class PedidoItemSucursalDialogComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('addButton') addButton: ElementRef;
  @ViewChild('saveButton', { static: false, read: MatButton }) saveButton: MatButton;
  
  // ViewChild references for form controls navigation
  @ViewChildren('cantidadInput') cantidadInputs: QueryList<ElementRef>;
  @ViewChildren('sucursalEntregaSelect') sucursalEntregaSelects: QueryList<MatSelect>;

  // Embedded mode inputs
  @Input() isEmbedded: boolean = false;
  @Input() embeddedPedidoItem: PedidoItem | null = null;
  @Input() embeddedSucursalInfluenciaList: Sucursal[] = [];
  @Input() embeddedSucursalEntregaList: Sucursal[] = [];
  @Input() embeddedAutoSet: boolean = false;
  @Input() embeddedIsReadOnly: boolean = false; // NEW: Read-only mode for embedded mode

  // Embedded mode outputs
  @Output() embeddedPedidoItemChange = new EventEmitter<PedidoItem | null>();
  @Output() embeddedSaved = new EventEmitter<{success: boolean, updatedPedidoItem?: PedidoItem, quantityChanged?: boolean}>();
  @Output() embeddedCancelled = new EventEmitter<void>();

  // Navigation state management
  private selectOpenStates: boolean[] = [];
  private selectEnterCounts: number[] = [];

  sucursalInfluenciaList: Sucursal[] = [];
  selectedPedidoItem: PedidoItem;
  sucursales: Sucursal[];
  sucEntregaPorDefecto: Sucursal;
  cantAgregada = 0;

  // Change the type of the control maps to use array index instead of sucursal id
  cantidadControls: FormControl[] = [];
  sucursalEntregaControls: FormControl[] = [];
  sucursalInfluenciaControl = new FormControl(null, Validators.required);
  existingPedidoItemSucursales: PedidoItemSucursal[] = [];

  isAddNewSucursal = false;
  sucursalEntregaLoaded: boolean = false;
  isLoadingStock: boolean = false;

  pedidoItemSucursalList: PedidoItemSucursal[] = [];

  // Computed properties for step-specific values
  currentStepComputed: PedidoStep = PedidoStep.DETALLES_PEDIDO;
  presentacionComputed: any = null;
  cantidadComputed: number = 0;

  // Track quantity changes for embedded mode
  private quantityWasChanged: boolean = false;
  
  // Save button state
  isSaveButtonEnabled: boolean = false;

  private updateComputedPropertiesTimeout: any;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA)
    public data: {
      pedidoItem?: PedidoItem;
      pedido?: any; // **NEW**: Explicit pedido reference for estado-based field access
      sucursalInfluenciaList?: Sucursal[];
      sucursalEntregaList?: Sucursal[];
      autoSet?: boolean; // Si es true, se setea la cantidad y la sucursal de entrega por defecto
    } | null,
    @Optional() private dialogRef: MatDialogRef<PedidoItemSucursalDialogComponent>,
    private sucursalService: SucursalService,
    private movStockService: MovimientoStockService,
    private pedidoItemSucursalService: PedidoItemSucursalService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private pedidoService: PedidoService
  ) {
    // Only initialize from dialog data if not in embedded mode
    if (!this.isEmbedded && this.data) {
      this.initializeFromDialogData();
    }
  }

  private initializeFromDialogData(): void {
    this.sucursalService.onGetAllSucursales().subscribe((sucRes) => {
      this.sucursales = sucRes;
      if (this.data?.pedidoItem && this.data?.sucursalInfluenciaList) {
        // Convert plain object to PedidoItem instance
        const pedidoItem = new PedidoItem();
        Object.assign(pedidoItem, this.data.pedidoItem);
        
        // **CRITICAL FIX**: Ensure pedido reference is set correctly for estado-based field access
        if (this.data.pedido) {
          pedidoItem.pedido = this.data.pedido;
        } else if (!pedidoItem.pedido && this.data.pedidoItem?.pedido) {
          // Fallback: if no explicit pedido passed, use the one from pedidoItem
          pedidoItem.pedido = this.data.pedidoItem.pedido;
        }
        
        this.selectedPedidoItem = pedidoItem;
        this.sucursalInfluenciaList = this.data.sucursalInfluenciaList;
        this.updateComputedProperties();
        this.loadPedidoItemSucursalAndInitControls();
      }
    });
  }

  ngOnInit(): void {
    // Handle embedded mode initialization
    if (this.isEmbedded) {
      this.initializeEmbeddedMode();
    } else if (this.data?.autoSet) {
      this.handleAutoSet();
    }
  }

  private initializeEmbeddedMode(): void {
    this.sucursalService.onGetAllSucursales().subscribe((sucRes) => {
      this.sucursales = sucRes;
      if (this.embeddedPedidoItem) {
        // Convert plain object to PedidoItem instance if needed
        let pedidoItem: PedidoItem;
        if (this.embeddedPedidoItem instanceof PedidoItem) {
          pedidoItem = this.embeddedPedidoItem;
        } else {
          pedidoItem = new PedidoItem();
          Object.assign(pedidoItem, this.embeddedPedidoItem);
        }
        this.selectedPedidoItem = pedidoItem;
        
        // **FIX**: Extract sucursal lists from pedido data automatically
        // First try embedded inputs, then fall back to pedido data
        if (this.embeddedSucursalInfluenciaList && this.embeddedSucursalInfluenciaList.length > 0) {
          this.sucursalInfluenciaList = this.embeddedSucursalInfluenciaList;
        } else {
          // Extract from pedido.sucursalInfluenciaList
          this.sucursalInfluenciaList = (pedidoItem.pedido?.sucursalInfluenciaList || []).map(si => si.sucursal);
        }
        
        // Set default sucursal entrega list for form controls
        this.data = this.data || {};
        if (!this.data.sucursalEntregaList && pedidoItem.pedido?.sucursalEntregaList) {
          this.data.sucursalEntregaList = pedidoItem.pedido.sucursalEntregaList.map(se => se.sucursal);
        } else if (this.embeddedSucursalEntregaList && this.embeddedSucursalEntregaList.length > 0) {
          this.data.sucursalEntregaList = this.embeddedSucursalEntregaList;
        }
        
        this.updateComputedProperties();
        this.loadPedidoItemSucursalAndInitControls();
      }
    });
  }

  private handleAutoSet(): void {
    if (!this.data) return;
    
    let pedidoItemSucursal = new PedidoItemSucursal();
    pedidoItemSucursal.sucursal = this.data.sucursalInfluenciaList?.[0];
    pedidoItemSucursal.sucursalEntrega = this.data.sucursalEntregaList?.[0];
    
    // Convert plain object to PedidoItem instance if needed
    let pedidoItem: PedidoItem;
    if (this.data.pedidoItem instanceof PedidoItem) {
      pedidoItem = this.data.pedidoItem;
    } else {
      pedidoItem = new PedidoItem();
      Object.assign(pedidoItem, this.data.pedidoItem);
    }
    pedidoItemSucursal.pedidoItem = pedidoItem;
    this.selectedPedidoItem = pedidoItem;
    
    // Use computed properties instead of direct field access
    this.updateComputedProperties();
    // throw error if presentacionComputed is null
    if (!this.presentacionComputed) {
      throw new Error('presentacionComputed is null');
    }
    pedidoItemSucursal.cantidadPorUnidad = this.cantidadComputed * (this.presentacionComputed?.cantidad || 1);
    pedidoItemSucursal.usuario = this.mainService.usuarioActual;
    this.pedidoItemSucursalService.onSavePedidoItemSucursal(pedidoItemSucursal.toInput()).subscribe(res => {
      if (this.isEmbedded) {
        this.embeddedSaved.emit({success: true, updatedPedidoItem: this.selectedPedidoItem, quantityChanged: this.quantityWasChanged});
      } else {
        this.dialogRef?.close(true);
      }
    });
  }

  private updateComputedProperties(): void {
    // **PERFORMANCE**: Debounce update to prevent excessive calls
    this.updateComputedPropertiesDebounced();
  }

  private updateComputedPropertiesImmediate(): void {
    if (this.selectedPedidoItem) {
      // Determine current step from pedido estado
      this.currentStepComputed = this.pedidoService.getCurrentStepFromPedidoEstado(this.selectedPedidoItem.pedido?.estado);
      
      // Get estado-specific values using helper methods
      this.presentacionComputed = this.selectedPedidoItem.getFieldValueForEstado('presentacion', this.selectedPedidoItem.pedido?.estado);
      this.cantidadComputed = this.selectedPedidoItem.getFieldValueForEstado('cantidad', this.selectedPedidoItem.pedido?.estado);
      
      // Recalculate cantAgregada to ensure UI shows correct values
      if (this.cantidadControls && this.cantidadControls.length > 0) {
        this.calcularCantAdicionada();
      }
    }
  }

  private updateComputedPropertiesDebounced(): void {
    if (this.updateComputedPropertiesTimeout) {
      clearTimeout(this.updateComputedPropertiesTimeout);
    }
    
    this.updateComputedPropertiesTimeout = setTimeout(() => {
      this.updateComputedPropertiesImmediate();
    }, 10); // 10ms debounce - shorter delay since this affects UI state
  }

  // Getters for template
  get currentPresentacion(): any {
    return this.presentacionComputed;
  }

  get currentCantidad(): number {
    return this.cantidadComputed;
  }

  ngAfterViewInit() {
    // Focus on first cantidad input when component is ready
    setTimeout(() => {
      this.focusFirstCantidadInput();
    }, 200);
  }

  loadPedidoItemSucursalAndInitControls(): void {
    this.pedidoItemSucursalService
      .onGetPedidoItensSucursalByPedidoItem(this.selectedPedidoItem.id)
      .subscribe(pedidoItemSucursales => {
        this.existingPedidoItemSucursales = pedidoItemSucursales || [];
        
        // Create the combined list
        this.pedidoItemSucursalList = [...this.existingPedidoItemSucursales];
        
        // Add missing sucursales from sucursalInfluenciaList
        this.sucursalInfluenciaList.forEach(sucursal => {
          if (!this.pedidoItemSucursalList.some(pis => pis.sucursal.id === sucursal.id)) {
            const newPedidoItemSucursal = new PedidoItemSucursal();
            newPedidoItemSucursal.sucursal = sucursal;
            newPedidoItemSucursal.pedidoItem = this.selectedPedidoItem;
            newPedidoItemSucursal.cantidadPorUnidad = 0;
            newPedidoItemSucursal.usuario = this.mainService.usuarioActual;
            newPedidoItemSucursal.stockDisponible = 0; // Initialize stock
            
            // Set default sucursal entrega if available
            if (this.data.sucursalEntregaList?.length === 1) {
              newPedidoItemSucursal.sucursalEntrega = this.data.sucursalEntregaList[0];
            }
            
            this.pedidoItemSucursalList.push(newPedidoItemSucursal);
          }
        });

        // Load stock for all items (both existing and new)
        this.loadStockForAllItems();
        this.initializeFormControls();
      });
  }

  private loadStockForAllItems(): void {
    const stockQueries: Observable<number>[] = [];
    this.isLoadingStock = true;
    
    this.pedidoItemSucursalList.forEach((item, index) => {
      if (item.sucursal && this.selectedPedidoItem.producto) {
        const stockQuery = this.movStockService.onGetStockPorProducto(
          this.selectedPedidoItem.producto.id,
          item.sucursal.id
        );
        stockQueries.push(stockQuery);
      } else {
        // Create an observable that returns 0 for items without proper data
        stockQueries.push(new Observable(subscriber => {
          subscriber.next(0);
          subscriber.complete();
        }));
      }
    });

    // Execute all stock queries in parallel
    if (stockQueries.length > 0) {
      forkJoin(stockQueries).subscribe({
        next: (stockResults) => {
          stockResults.forEach((stock, index) => {
            if (this.pedidoItemSucursalList[index]) {
              this.pedidoItemSucursalList[index].stockDisponible = stock || 0;
            }
          });
          this.isLoadingStock = false;
        },
        error: (error) => {
          console.error('Error loading stock information:', error);
          // Set all stocks to 0 on error
          this.pedidoItemSucursalList.forEach(item => {
            item.stockDisponible = 0;
          });
          this.isLoadingStock = false;
        }
      });
    } else {
      this.isLoadingStock = false;
    }
  }

  initializeFormControls(): void {
    // Clear existing controls
    this.cantidadControls = [];
    this.sucursalEntregaControls = [];
    this.selectOpenStates = [];
    this.selectEnterCounts = [];

    // Create controls for all items in pedidoItemSucursalList
    this.pedidoItemSucursalList.forEach(item => {
      // Create cantidad control
      const cantidadControl = new FormControl(
        item.cantidadPorUnidad / (this.currentPresentacion?.cantidad || 1),
        [Validators.required, Validators.min(0)]
      );
      
      // **NEW**: Disable control if in read-only mode
      if (this.embeddedIsReadOnly) {
        cantidadControl.disable();
      } else {
        cantidadControl.valueChanges.subscribe(() => {
          this.calcularCantAdicionada();
          this.updateSaveButtonState();
        });
      }
      this.cantidadControls.push(cantidadControl);

      // Create sucursal entrega control
      const sucursalEntregaControl = new FormControl(
        item.sucursalEntrega ? this.sucursales.find(s => s.id === item.sucursalEntrega.id) : null,
        Validators.required
      );
      
      // **NEW**: Disable control if in read-only mode
      if (this.embeddedIsReadOnly) {
        sucursalEntregaControl.disable();
      } else {
        sucursalEntregaControl.valueChanges.subscribe(() => {
          this.updateSaveButtonState();
        });
      }
      this.sucursalEntregaControls.push(sucursalEntregaControl);
      
      // Initialize navigation state
      this.selectOpenStates.push(false);
      this.selectEnterCounts.push(0);
    });

    this.sucursalEntregaLoaded = true;
    this.calcularCantAdicionada();
    this.updateSaveButtonState();
  }

  // Focus management methods
  private focusFirstCantidadInput(): void {
    if (this.cantidadInputs && this.cantidadInputs.length > 0) {
      const firstInput = this.cantidadInputs.first;
      if (firstInput?.nativeElement) {
        firstInput.nativeElement.focus();
        firstInput.nativeElement.select();
      }
    }
  }

  private focusCantidadInput(index: number): void {
    if (this.cantidadInputs && this.cantidadInputs.toArray()[index]) {
      const input = this.cantidadInputs.toArray()[index];
      if (input?.nativeElement) {
        input.nativeElement.focus();
        input.nativeElement.select();
      }
    }
  }

  private focusSucursalEntregaSelect(index: number): void {
    if (this.sucursalEntregaSelects && this.sucursalEntregaSelects.toArray()[index]) {
      const select = this.sucursalEntregaSelects.toArray()[index];
      if (select) {
        select.focus();
        this.selectEnterCounts[index] = 0; // Reset enter count
      }
    }
  }

  // Keyboard event handlers
  onCantidadEnter(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.focusSucursalEntregaSelect(index);
    }
  }

  onSucursalEntregaEnter(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.selectEnterCounts[index]++;
      
      const select = this.sucursalEntregaSelects.toArray()[index];
      
      if (this.selectEnterCounts[index] === 1) {
        // First Enter: open the dropdown
        if (select && !select.panelOpen) {
          select.open();
          this.selectOpenStates[index] = true;
        }
      } else if (this.selectEnterCounts[index] >= 2) {
        // Second Enter: close dropdown and move to next field
        if (select && select.panelOpen) {
          select.close();
          this.selectOpenStates[index] = false;
        }
        
        // Move to next cantidad input or focus save button if last
        setTimeout(() => {
          const nextIndex = index + 1;
          if (nextIndex < this.cantidadControls.length) {
            this.focusCantidadInput(nextIndex);
          } else {
            // Focus on save button if it's the last field
            this.focusSaveButton();
          }
        }, 100);
      }
    }
  }

  onSucursalEntregaClosed(index: number): void {
    // Reset state when dropdown is closed
    this.selectOpenStates[index] = false;
    this.selectEnterCounts[index] = 0;
    if(index === this.cantidadControls.length - 1) {
      this.focusSaveButton();
    }
  }

  private focusSaveButton(): void {
    if (this.saveButton?._elementRef.nativeElement) {
      this.saveButton._elementRef.nativeElement.focus();
    } else if (this.addButton?.nativeElement) {
      // Fallback to add button if save button is not available
      this.addButton.nativeElement.focus();
    }
  }

  // Add trackBy function for better performance in ngFor
  trackByIndex(index: number, item: any): number {
    return index;
  }

  cantidadesPorIgual() {
    // Get the number of sucursales (using 0 as fallback if undefined)
    const cantSucursales = this.sucursalInfluenciaList?.length || 0;
    // Total quantity to be divided among the sucursales
    const cantTotal = this.currentCantidad;

    if (cantSucursales > 0) {
      // Calculate the base amount for each sucursal using integer division
      const base = Math.floor(cantTotal / cantSucursales);
      // Calculate the remainder (extra quantity to assign to the first sucursal)
      const remainder = cantTotal % cantSucursales;

      // Iterate over the sucursales and assign the quantity to each control
      this.sucursalInfluenciaList.forEach((sucursal, index) => {
        // The first sucursal gets the base plus the remainder; others get the base value.
        const cantidadAsignada = index === 0 ? base + remainder : base;
        this.cantidadControls[index].setValue(cantidadAsignada);
      });
      this.calcularCantAdicionada();
      this.updateSaveButtonState();
    }
  }

  calcularCantAdicionada() {
    console.log('cantidadControls', this.cantidadControls);
    this.cantAgregada = this.cantidadControls.reduce((total, control) => 
      total + (control.value || 0), 0);
    console.log('cantAgregada', this.cantAgregada);
  }

  onAddSucursal() {
    this.isAddNewSucursal = true;
  }

  onCreateControls(sucursal: Sucursal) {
    // Create form controls
    const control = new FormControl(0, [
      Validators.required,
      Validators.min(0),
    ]);
    
    // **NEW**: Disable control if in read-only mode
    if (this.embeddedIsReadOnly) {
      control.disable();
    } else {
      control.valueChanges.subscribe(() => {
        this.calcularCantAdicionada();
        this.updateSaveButtonState();
      });
    }
    
    this.cantidadControls.push(control);
    
    const sucursalEntregaControl = new FormControl(
      this.sucEntregaPorDefecto,
      Validators.required
    );
    
    // **NEW**: Disable control if in read-only mode
    if (this.embeddedIsReadOnly) {
      sucursalEntregaControl.disable();
    } else {
      sucursalEntregaControl.valueChanges.subscribe(() => {
        this.updateSaveButtonState();
      });
    }
    
    this.sucursalEntregaControls.push(sucursalEntregaControl);

    // Create and add new PedidoItemSucursal to the list
    const newPedidoItemSucursal = new PedidoItemSucursal();
    newPedidoItemSucursal.sucursal = sucursal;
    newPedidoItemSucursal.pedidoItem = this.selectedPedidoItem;
    newPedidoItemSucursal.cantidadPorUnidad = 0;
    newPedidoItemSucursal.usuario = this.mainService.usuarioActual;
    newPedidoItemSucursal.sucursalEntrega = this.sucEntregaPorDefecto;
    newPedidoItemSucursal.stockDisponible = 0; // Initialize stock
    
    this.pedidoItemSucursalList.push(newPedidoItemSucursal);
    
    // Load stock for the new sucursal
    if (this.selectedPedidoItem.producto) {
      this.movStockService.onGetStockPorProducto(
        this.selectedPedidoItem.producto.id,
        sucursal.id
      ).subscribe({
        next: (stock) => {
          newPedidoItemSucursal.stockDisponible = stock || 0;
        },
        error: (error) => {
          console.error('Error loading stock for new sucursal:', error);
          newPedidoItemSucursal.stockDisponible = 0;
        }
      });
    }
    
    // Update other lists and controls
    this.sucursalInfluenciaList.push(sucursal);
    this.sucursalInfluenciaControl.setValue(null);
    this.isAddNewSucursal = false;
    
    // Update navigation state arrays
    this.selectOpenStates.push(false);
    this.selectEnterCounts.push(0);
    
    // Update save button state
    this.updateSaveButtonState();
  }

  cantidadesSegunMovimiento() {
    let fechaInicio = new Date();
    let fechaFin = new Date();
    fechaInicio.setDate(fechaFin.getDate() - 100);

    this.movStockService.onGetMovimientoStockPorFiltros(
      dateToString(fechaInicio),
      dateToString(fechaFin),
      this.sucursalInfluenciaList.map(fi => fi.id),
      this.selectedPedidoItem.producto.id,
      new Array(TipoMovimiento.VENTA),
      null,
      0,
      this.sucursalInfluenciaList?.length
    ).subscribe(res => {
      // Agrupar ventas por sucursal
      const ventasPorSucursal: { [key: number]: number } = {};
      let totalVentas = 0;

      // Inicializar ventas en 0 para todas las sucursales
      this.sucursalInfluenciaList.forEach(suc => {
        ventasPorSucursal[suc.id] = 0;
      });

      // Sumar las cantidades de venta por sucursal (en positivo)
      res.getContent.forEach(mov => {
        ventasPorSucursal[mov.sucursalId] += Math.abs(mov.cantidad);
        totalVentas += Math.abs(mov.cantidad);
      });

      // Si no hay ventas, distribuir equitativamente
      if (totalVentas === 0) {
        this.cantidadesPorIgual();
        return;
      }

      // Calcular y asignar cantidades según porcentaje de ventas
      const cantidadTotal = this.currentCantidad;
      let cantidadAsignada = 0;

      this.sucursalInfluenciaList.forEach((sucursal, index) => {
        const porcentaje = ventasPorSucursal[sucursal.id] / totalVentas;
        let cantidad = Math.floor(cantidadTotal * porcentaje);

        // Si es la última sucursal, asignar el resto para evitar pérdidas por redondeo
        if (index === this.sucursalInfluenciaList.length - 1) {
          cantidad = cantidadTotal - cantidadAsignada;
        }

        this.cantidadControls[index].setValue(cantidad);
        cantidadAsignada += cantidad;
      });

      this.calcularCantAdicionada();
      this.updateSaveButtonState();
    });
  }

  onCancelar() {
    if (this.isEmbedded) {
      this.embeddedCancelled.emit();
    } else {
      this.dialogRef?.close(true);
    }
  }

  onGuardar() {
    // Calculate total distributed quantity
    const totalDistributed = this.cantidadControls.reduce((total, control) => 
      total + (control.value || 0), 0);
    const originalQuantity = this.currentCantidad; // Use computed quantity instead of cantidadCreacion
    
    // Check if distributed quantity differs from original
    if (totalDistributed !== originalQuantity) {
      this.showQuantityChangeConfirmation(totalDistributed, originalQuantity);
      return;
    }
    
    // If quantities match, proceed with normal save
    this.proceedWithSave();
  }

  private showQuantityChangeConfirmation(newQuantity: number, originalQuantity: number): void {
    const diferenciaPresentacion = newQuantity - originalQuantity;
    const cantidadUnidades = diferenciaPresentacion * (this.currentPresentacion?.cantidad || 1);
    
    const message = `Se detectó que la cantidad total del pedido item cambió de ${originalQuantity} a ${newQuantity}.\n\n` +
      `¿Desea actualizar la cantidad en el pedido item?\n\n` +
      `Diferencia: ${diferenciaPresentacion} (${cantidadUnidades} unidades)`;
    
    this.dialogosService.confirm(
      'Confirmar cambio de cantidad',
      message
    ).subscribe(result => {
      if (result) {
        this.updatePedidoItemQuantityAndSave(newQuantity);
      } else {
        this.proceedWithSave();
      }
    });
  }

  private updatePedidoItemQuantityAndSave(newQuantity: number): void {
    // throw error if currentPresentacion is null
    if (!this.currentPresentacion) {
      throw new Error('currentPresentacion is null');
    }
    
    // Also update valorTotal if needed
    const cantidadPresentacion = this.currentPresentacion?.cantidad || 1;
    const precioUnitario = this.selectedPedidoItem.getFieldValueForEstado('precioUnitario', this.selectedPedidoItem.pedido?.estado) || 0;
    const descuentoUnitario = this.selectedPedidoItem.getFieldValueForEstado('descuentoUnitario', this.selectedPedidoItem.pedido?.estado) || 0;


    // Update the quantity in the pedido item using estado-specific fields
    this.selectedPedidoItem.setFieldValueForEstado('cantidad', newQuantity, this.selectedPedidoItem.pedido?.estado);

    
    // Calculate new total value
    const newValorTotal = (newQuantity * cantidadPresentacion) * (precioUnitario - descuentoUnitario);
    this.selectedPedidoItem.valorTotal = newValorTotal;

    // Add automatic modification reason for quantity change
    const currentStep = this.currentStepComputed;
    if (currentStep === PedidoStep.RECEPCION_NOTA) {
      this.selectedPedidoItem.motivoModificacionRecepcionNota = this.addMotivoToExisting(
        this.selectedPedidoItem.motivoModificacionRecepcionNota || '', 
        'CANTIDAD_INCORRECTA'
      );
      this.selectedPedidoItem.usuarioRecepcionNota = this.mainService.usuarioActual;
    } else if (currentStep === PedidoStep.RECEPCION_PRODUCTO) {
      this.selectedPedidoItem.motivoModificacionRecepcionProducto = this.addMotivoToExisting(
        this.selectedPedidoItem.motivoModificacionRecepcionProducto || '', 
        'CANTIDAD_INCORRECTA'
      );
      this.selectedPedidoItem.usuarioRecepcionProducto = this.mainService.usuarioActual;
    }

    // Mark that quantity was changed
    this.quantityWasChanged = true;

    // Save the updated pedido item to database
    this.pedidoService.onSaveItem(this.selectedPedidoItem.toInput()).subscribe({
      next: (savedItem) => {
        // **FIX**: Preserve the pedido reference before Object.assign overwrites it
        const originalPedido = this.selectedPedidoItem.pedido;
        
        // Update the local reference with saved data
        Object.assign(this.selectedPedidoItem, savedItem);
        
        // **FIX**: Restore the pedido reference after Object.assign
        this.selectedPedidoItem.pedido = originalPedido;
        
        // **FIX**: Call updateComputedPropertiesImmediate() synchronously to ensure
        // currentPresentacion is updated before proceedWithSave() is called
        // This solves the bug where cantidadPorUnidad was saved as presentations instead of units
        // because currentPresentacion was null due to the debounce delay in updateComputedProperties()
        this.updateComputedPropertiesImmediate();
        
        // Emit the updated pedidoItem for two-way binding
        if (this.isEmbedded) {
          this.embeddedPedidoItemChange.emit(this.selectedPedidoItem);
        }
        
        // Continue with the save process
        this.proceedWithSave();
      },
      error: (error) => {
        console.error('Error saving pedido item:', error);
        this.notificacionService.openWarn('Error al guardar los cambios del item');
        this.quantityWasChanged = false; // Reset flag on error
      }
    });
  }

  private addMotivoToExisting(existingMotivos: string, newMotivo: string): string {
    if (!existingMotivos || existingMotivos.trim() === '') {
      return newMotivo;
    }
    
    const motivos = existingMotivos.split(',').map(m => m.trim());
    if (!motivos.includes(newMotivo)) {
      motivos.push(newMotivo);
    }
    
    return motivos.join(',');
  }

  private proceedWithSave(): void {
    const saveOperations: Observable<any>[] = [];
    const combinationMap = new Map<string, boolean>();

    // Function to check for duplicates
    const isDuplicate = (sucursal: Sucursal, sucursalEntrega: Sucursal): boolean => {
      const key = `${sucursal.id}-${sucursalEntrega.id}`;
      if (combinationMap.has(key)) {
        return true;
      }
      combinationMap.set(key, true);
      return false;
    };

    // If we have existing items, update or create new ones
    if (this.existingPedidoItemSucursales.length > 0) {
      for (let i = 0; i < this.pedidoItemSucursalList.length; i++) {
        const cantidad = this.cantidadControls[i].value;
        const sucursalEntrega = this.sucursalEntregaControls[i].value;
        const item = this.pedidoItemSucursalList[i];

        if (cantidad > 0) {
          // Check for duplicates
          if (isDuplicate(item.sucursal, sucursalEntrega)) {
            this.notificacionService.openWarn(
              `Ya existe una combinación para la sucursal ${item.sucursal.nombre} con la sucursal de entrega ${sucursalEntrega.nombre}`
            );
            return;
          }

          const pedidoItemSucursal = new PedidoItemSucursal();
          Object.assign(pedidoItemSucursal, item);
                      pedidoItemSucursal.cantidadPorUnidad = cantidad * (this.currentPresentacion?.cantidad || 1);
          pedidoItemSucursal.sucursalEntrega = sucursalEntrega;
          
          saveOperations.push(
            this.pedidoItemSucursalService.onSavePedidoItemSucursal(pedidoItemSucursal.toInput())
          );
        }
      }
    } else {
      // If no existing items, create new ones from sucursalInfluenciaList
      for (let i = 0; i < this.sucursalInfluenciaList.length; i++) {
        const cantidad = this.cantidadControls[i].value;
        const sucursalEntrega = this.sucursalEntregaControls[i].value;
        const sucursal = this.sucursalInfluenciaList[i];

        if (cantidad > 0) {
          // Check for duplicates
          if (isDuplicate(sucursal, sucursalEntrega)) {
            this.notificacionService.openWarn(
              `Ya existe una combinación para la sucursal ${sucursal.nombre} con la sucursal de entrega ${sucursalEntrega.nombre}`
            );
            return;
          }

          const pedidoItemSucursal = new PedidoItemSucursal();
          pedidoItemSucursal.cantidadPorUnidad = cantidad * (this.currentPresentacion?.cantidad || 1);
          pedidoItemSucursal.sucursalEntrega = sucursalEntrega;
          pedidoItemSucursal.pedidoItem = this.selectedPedidoItem;
          pedidoItemSucursal.sucursal = sucursal;
          pedidoItemSucursal.usuario = this.mainService.usuarioActual;
          
          saveOperations.push(
            this.pedidoItemSucursalService.onSavePedidoItemSucursal(pedidoItemSucursal.toInput())
          );
        }
      }
    }

    if (saveOperations.length > 0) {
      forkJoin(saveOperations).subscribe({
        next: (results) => {
          // Update local items with saved data (including new IDs)
          let resultIndex = 0;
          for (let i = 0; i < this.pedidoItemSucursalList.length; i++) {
            const item = this.pedidoItemSucursalList[i];
            const cantidad = this.cantidadControls[i].value;
            const sucursalEntrega = this.sucursalEntregaControls[i].value;
            
            if (cantidad > 0 && sucursalEntrega && resultIndex < results.length) {
              // Update the local item with the saved data
              Object.assign(item, results[resultIndex]);
              resultIndex++;
            }
          }
          
          // Update existingPedidoItemSucursales to reflect the current saved state
          this.existingPedidoItemSucursales = [...this.pedidoItemSucursalList.filter(item => item.id)];
          
          this.notificacionService.openSucess("Distribución guardada correctamente");
          // Update save button state after successful save
          this.updateSaveButtonState();
          if (this.isEmbedded) {
            this.embeddedSaved.emit({success: true, updatedPedidoItem: this.selectedPedidoItem, quantityChanged: this.quantityWasChanged});
          } else {
            this.dialogRef?.close(true);
          }
        },
        error: (error) => {
          this.notificacionService.openWarn("Error al guardar la distribución");
          console.error('Error saving distribution:', error);
        }
      });
    } else {
      // No operations to save, just close
      // Update save button state
      this.updateSaveButtonState();
      if (this.isEmbedded) {
        this.embeddedSaved.emit({success: true, updatedPedidoItem: this.selectedPedidoItem, quantityChanged: this.quantityWasChanged});
      } else {
        this.dialogRef?.close(true);
      }
    }
  }

  seleccionarSucursal() {
    this.sucursalService.openSearchDialog().subscribe(sucursal => {
      if (sucursal) {
        // Iterate through all sucursalEntregaControls and set the selected sucursal
        this.sucursalEntregaControls.forEach((control, index) => {
          control.setValue(sucursal);
        });
        this.updateSaveButtonState();
      }
    });
  }

  onDelete(index: number) {
    const itemToDelete = this.pedidoItemSucursalList[index];
    
    if (itemToDelete.id) {
      // Item exists in database, call delete service
      this.pedidoItemSucursalService.onDeletePedidoItemSucursal(itemToDelete.id).subscribe({
        next: () => {
          this.pedidoItemSucursalList.splice(index, 1);
          this.cantidadControls.splice(index, 1);
          this.sucursalEntregaControls.splice(index, 1);
          this.calcularCantAdicionada();
          this.updateSaveButtonState();
          this.notificacionService.openSucess('Elemento eliminado correctamente');
        },
        error: (error) => {
          this.notificacionService.openWarn('Error al eliminar el elemento');
        }
      });
    } else {
      // Item only exists in memory, just remove from arrays
      this.pedidoItemSucursalList.splice(index, 1);
      this.cantidadControls.splice(index, 1);
      this.sucursalEntregaControls.splice(index, 1);
      this.calcularCantAdicionada();
      this.updateSaveButtonState();
    }
  }

  // Getter to determine if dialog header should be visible
  get showDialogHeader(): boolean {
    return !this.isEmbedded;
  }

  // Getter to determine dialog title
  get dialogTitle(): string {
    if (!this.selectedPedidoItem?.producto) {
      return this.embeddedIsReadOnly ? 'Ver Distribución por Sucursales' : 'Distribución por Sucursales';
    }
    const prefix = this.embeddedIsReadOnly ? 'Ver' : 'Distribución';
    return `${prefix} - ${this.selectedPedidoItem.producto.descripcion}`;
  }

  // **NEW**: Getter to check if controls should be disabled
  get isReadOnlyMode(): boolean {
    return this.embeddedIsReadOnly;
  }

  // **NEW**: Getter to check if action buttons should be visible
  get showActionButtons(): boolean {
    return !this.embeddedIsReadOnly;
  }

  // **NEW**: Method to update save button state
  private updateSaveButtonState(): void {
    if (this.embeddedIsReadOnly || !this.sucursalEntregaLoaded) {
      this.isSaveButtonEnabled = false;
      return;
    }
    
    // Check if there are any items with quantity > 0 that need to be saved
    let hasChangesToSave = false;
    
    for (let i = 0; i < this.pedidoItemSucursalList.length; i++) {
      const item = this.pedidoItemSucursalList[i];
      const cantidad = this.cantidadControls[i]?.value || 0;
      const sucursalEntrega = this.sucursalEntregaControls[i]?.value;
      
      if (cantidad > 0 && sucursalEntrega) {
        // Check if this is a new item (no id) or if values have changed
        if (!item.id) {
          // New item with quantity > 0
          hasChangesToSave = true;
          break;
        } else {
          // Existing item - check if values have changed
          const originalCantidad = item.cantidadPorUnidad / (this.currentPresentacion?.cantidad || 1);
          const currentCantidad = cantidad;
          const originalSucursalEntrega = item.sucursalEntrega;
          const currentSucursalEntrega = sucursalEntrega;
          
          if (originalCantidad !== currentCantidad || 
              originalSucursalEntrega?.id !== currentSucursalEntrega?.id) {
            hasChangesToSave = true;
            break;
          }
        }
      }
    }
    
    this.isSaveButtonEnabled = hasChangesToSave;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['embeddedPedidoItem'] && this.embeddedPedidoItem && this.isEmbedded) {
      // Convert plain object to PedidoItem instance if needed
      let pedidoItem: PedidoItem;
      if (this.embeddedPedidoItem instanceof PedidoItem) {
        pedidoItem = this.embeddedPedidoItem;
      } else {
        pedidoItem = new PedidoItem();
        Object.assign(pedidoItem, this.embeddedPedidoItem);
      }
      this.selectedPedidoItem = pedidoItem;
      
      // Update computed properties
      this.updateComputedProperties();
      
      // Reload the data and reinitialize controls
      if (this.sucursales && this.sucursales.length > 0) {
        this.loadPedidoItemSucursalAndInitControls();
      }
    }
  }
}
