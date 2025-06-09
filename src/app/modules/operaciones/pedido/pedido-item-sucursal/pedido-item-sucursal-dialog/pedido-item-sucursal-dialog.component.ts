import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit, QueryList, ViewChildren } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSelect } from "@angular/material/select";
import { PedidoItem, PedidoStep } from "../../edit-pedido/pedido-item.model";
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
  selector: "pedido-item-sucursal-dialog",
  templateUrl: "./pedido-item-sucursal-dialog.component.html",
  styleUrls: ["./pedido-item-sucursal-dialog.component.scss"],
})
export class PedidoItemSucursalDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('addButton') addButton: ElementRef;
  @ViewChild('saveButton', { static: false, read: MatButton }) saveButton: MatButton;
  
  // ViewChild references for form controls navigation
  @ViewChildren('cantidadInput') cantidadInputs: QueryList<ElementRef>;
  @ViewChildren('sucursalEntregaSelect') sucursalEntregaSelects: QueryList<MatSelect>;

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

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      pedidoItem?: PedidoItem;
      sucursalInfluenciaList?: Sucursal[];
      sucursalEntregaList?: Sucursal[];
      autoSet?: boolean; // Si es true, se setea la cantidad y la sucursal de entrega por defecto
    },
    private dialogRef: MatDialogRef<PedidoItemSucursalDialogComponent>,
    private sucursalService: SucursalService,
    private movStockService: MovimientoStockService,
    private pedidoItemSucursalService: PedidoItemSucursalService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private pedidoService: PedidoService
  ) {
    sucursalService.onGetAllSucursales().subscribe((sucRes) => {
      this.sucursales = sucRes;
      if (data.pedidoItem && data.sucursalInfluenciaList) {
        this.selectedPedidoItem = data.pedidoItem;
        this.sucursalInfluenciaList = data.sucursalInfluenciaList;
        this.updateComputedProperties();
        this.loadPedidoItemSucursalAndInitControls();
      }
    });
  }

  ngOnInit(): void {
    if (this.data.autoSet) {
      let pedidoItemSucursal = new PedidoItemSucursal();
      pedidoItemSucursal.sucursal = this.data.sucursalInfluenciaList[0];
      pedidoItemSucursal.sucursalEntrega = this.data.sucursalEntregaList[0];
      pedidoItemSucursal.pedidoItem = this.data.pedidoItem;
      // Use computed properties instead of direct field access
      this.updateComputedProperties();
      pedidoItemSucursal.cantidadPorUnidad = this.cantidadComputed * (this.presentacionComputed?.cantidad || 1);
      pedidoItemSucursal.usuario = this.mainService.usuarioActual;
      this.pedidoItemSucursalService.onSavePedidoItemSucursal(pedidoItemSucursal.toInput()).subscribe(res => {
        this.dialogRef.close(true);
      });
    }
  }

  private updateComputedProperties(): void {
    if (this.selectedPedidoItem) {
      // Determine current step from pedido estado
      this.currentStepComputed = this.pedidoService.getCurrentStepFromPedidoEstado(this.selectedPedidoItem.pedido?.estado);
      
      // Get step-specific values using helper methods
      this.presentacionComputed = this.selectedPedidoItem.getFieldValueForStep('presentacion', this.currentStepComputed);
      this.cantidadComputed = this.selectedPedidoItem.getFieldValueForStep('cantidad', this.currentStepComputed);
    }
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
      cantidadControl.valueChanges.subscribe(() => this.calcularCantAdicionada());
      this.cantidadControls.push(cantidadControl);

      // Create sucursal entrega control
      const sucursalEntregaControl = new FormControl(
        item.sucursalEntrega ? this.sucursales.find(s => s.id === item.sucursalEntrega.id) : null,
        Validators.required
      );
      this.sucursalEntregaControls.push(sucursalEntregaControl);
      
      // Initialize navigation state
      this.selectOpenStates.push(false);
      this.selectEnterCounts.push(0);
    });

    this.sucursalEntregaLoaded = true;
    this.calcularCantAdicionada();
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
        this.calcularCantAdicionada();
      });
    }
  }

  calcularCantAdicionada() {
    this.cantAgregada = this.cantidadControls.reduce((total, control) => 
      total + (control.value || 0), 0);
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
    control.valueChanges.subscribe(() => {
      this.calcularCantAdicionada();
    });
    
    this.cantidadControls.push(control);
    this.sucursalEntregaControls.push(new FormControl(
      this.sucEntregaPorDefecto,
      Validators.required
    ));

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
      const cantidadTotal = this.selectedPedidoItem.cantidadCreacion;
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
    });
  }

  onCancelar() {
    this.dialogRef.close(true);
  }
  onGuardar() {
    // Calculate total distributed quantity
    const totalDistributed = this.cantidadControls.reduce((total, control) => 
      total + (control.value || 0), 0);
    const originalQuantity = this.selectedPedidoItem.cantidadCreacion;
    
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
    // Update the quantity in the pedido item using step-specific fields
    this.selectedPedidoItem.setFieldValueForStep('cantidad', newQuantity, this.currentStepComputed);
    
    // Also update valorTotal if needed
    const cantidadPresentacion = this.currentPresentacion?.cantidad || 1;
    const precioUnitario = this.selectedPedidoItem.getFieldValueForStep('precioUnitario', this.currentStepComputed) || 0;
    const descuentoUnitario = this.selectedPedidoItem.getFieldValueForStep('descuentoUnitario', this.currentStepComputed) || 0;
    
    // Calculate new total value
    const newValorTotal = (newQuantity * cantidadPresentacion) * (precioUnitario - descuentoUnitario);
    this.selectedPedidoItem.valorTotal = newValorTotal;

    // Continue with the save process
    this.proceedWithSave();
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
          this.notificacionService.openSucess("Distribución guardada correctamente");
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.notificacionService.openWarn("Error al guardar la distribución");
          console.error('Error saving distribution:', error);
        }
      });
    } else {
      // No operations to save, just close
      this.dialogRef.close(true);
    }
  }

  seleccionarSucursal() {
    this.sucursalService.openSearchDialog().subscribe(sucursal => {
      if (sucursal) {
        // Iterate through all sucursalEntregaControls and set the selected sucursal
        this.sucursalEntregaControls.forEach((control, index) => {
          control.setValue(sucursal);
        });
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
    }
  }
}
