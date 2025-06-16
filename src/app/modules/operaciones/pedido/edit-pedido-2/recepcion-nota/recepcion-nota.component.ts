import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, Output, EventEmitter, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SelectionModel } from '@angular/cdk/collections';

import { Pedido } from '../../edit-pedido/pedido.model';
import { PedidoItem, PedidoStep } from '../../edit-pedido/pedido-item.model';
import { NotaRecepcion } from '../../nota-recepcion/nota-recepcion.model';
import { PageInfo } from '../../../../../app.component';

import { PedidoService } from '../../pedido.service';
import { NotaRecepcionService } from '../../nota-recepcion/nota-recepcion.service';
import { MainService } from '../../../../../main.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';

import { CrearNotaRecepcionDialogComponent } from './crear-nota-recepcion-dialog/crear-nota-recepcion-dialog.component';
import { ManageNotaItemsDialogComponent } from './manage-nota-items-dialog/manage-nota-items-dialog.component';
import { DividirItemDialogComponent } from '../../dividir-item-dialog/dividir-item-dialog.component';
import { AddProductDialogComponent, AddProductDialogData, AddProductDialogResult } from '../detalles-del-pedido/add-product-dialog/add-product-dialog.component';
import { ItemStatusDialogComponent, ItemStatusDialogData } from './item-status-dialog/item-status-dialog.component';
import { PedidoItemSucursalDialogComponent } from '../../pedido-item-sucursal/pedido-item-sucursal-dialog/pedido-item-sucursal-dialog.component';
import { dateToString, parseShortDate } from '../../../../../commons/core/utils/dateUtils';

interface PedidoItemWithStatus extends PedidoItem {
  // Add computed properties for better performance
  isAssigned: boolean;
  notaNumero?: number;
  notaTipoBoleta?: string;
  // Add computed display properties for estado-based field access
  displayPresentacion?: any;
  displayCantidad?: number;
  displayPrecioUnitario?: number;
  displayDescuentoUnitario?: number;
  displayValorTotal?: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-recepcion-nota',
  templateUrl: './recepcion-nota.component.html',
  styleUrls: ['./recepcion-nota.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecepcionNotaComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('itemsPaginator') itemsPaginator: MatPaginator;
  @ViewChild('notasPaginator') notasPaginator: MatPaginator;

  @Input() selectedPedido: Pedido;
  @Output() pedidoChange = new EventEmitter<Pedido>();
  @Output() stepValidChange = new EventEmitter<boolean>();

  // Form controls
  searchItemsControl = new FormControl('');
  searchNotasControl = new FormControl('');

  // Data sources
  pedidoItemsDataSource = new MatTableDataSource<PedidoItemWithStatus>([]);
  notasRecepcionDataSource = new MatTableDataSource<NotaRecepcion>([]);

  // Table columns
  pedidoItemsColumns = ['select', 'producto', 'presentacion', 'cantidad', 'precio', 'total', 'estado', 'acciones'];
  notasRecepcionColumns = ['numero', 'tipoBoleta', 'fecha', 'cantidadItems', 'valor', 'acciones'];

  // Selections
  itemsSelection = new SelectionModel<PedidoItemWithStatus>(true, []);
  selectedNotaRecepcion: NotaRecepcion | null = null;
  
  // ID-based selection tracking to persist across pagination (public for template access)
  selectedItemIds: Set<number> = new Set<number>();

  // Pagination
  pedidoItemsPage: PageInfo<PedidoItem>;
  notasRecepcionPage: PageInfo<NotaRecepcion>;

  // Loading states
  isLoadingItems = false;
  isLoadingNotas = false;
  isProcessing = false;

  // Summary data
  totalItems = 0;
  assignedItems = 0;
  pendingItems = 0;
  cancelledItems = 0;
  totalNotas = 0;
  itemsNeedingDistribution = 0;
  // **NEW**: Track non-cancelled pending items for step validation
  nonCancelledPendingItems = 0;

  // Computed properties for template (to avoid function calls in HTML)
  monedaSymbol = 'Gs.';
  hasDataComputed = false;
  isProcessingComputed = false;
  canCreateNotaComputed = false;
  canAssignItemsComputed = false;
  // **NEW**: Computed properties for nota status to avoid function calls in template
  notasWithComputedProperties: any[] = [];
  allSelectedComputed = false;
  itemsWithComputedProperties: any[] = [];
  // **NEW**: Computed property for step validation
  canProceedToNextStepComputed = false;

  // Debounce timeout reference
  private updateComputedPropertiesTimeout: any = null;
  
  // **MEMORY MANAGEMENT**: Periodic cleanup interval
  private cleanupInterval: any = null;

  // Debounced version of updateComputedProperties to prevent excessive calls
  private updateComputedPropertiesDebounced = () => {
    if (this.updateComputedPropertiesTimeout) {
      clearTimeout(this.updateComputedPropertiesTimeout);
    }
    this.updateComputedPropertiesTimeout = setTimeout(() => {
      this.updateComputedPropertiesImmediate();
    }, 10); // 10ms debounce
  };

  constructor(
    private pedidoService: PedidoService,
    private notaRecepcionService: NotaRecepcionService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    // Clean up the debounce timeout
    if (this.updateComputedPropertiesTimeout) {
      clearTimeout(this.updateComputedPropertiesTimeout);
    }
    
    // Clean up periodic cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // **MEMORY CLEANUP**: Prevent memory leaks by clearing sets and arrays
    this.selectedItemIds.clear();
    this.itemsSelection.clear();
    this.notasWithComputedProperties = [];
    this.itemsWithComputedProperties = [];
    this.pedidoItemsDataSource.data = [];
    this.notasRecepcionDataSource.data = [];
  }

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.setupPeriodicCleanup();
    // Don't load data here - wait for OnChanges
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedPedido']) {
      const currentPedido = changes['selectedPedido'].currentValue;
      const previousPedido = changes['selectedPedido'].previousValue;
      
      // **OPTIMIZED**: Skip if both are falsy (avoiding undefined -> null transitions)
      if (!currentPedido && !previousPedido) {
        return;
      }
      
      // Only load data if pedido is available and different from previous
      if (currentPedido && currentPedido.id && currentPedido !== previousPedido) {
        this.loadInitialData();
      } else if (!currentPedido && previousPedido) {
        // Clear data if pedido becomes null (but only if it was previously not null)
        this.clearData();
      }
    }
  }

  private clearData(): void {
    this.pedidoItemsDataSource.data = [];
    this.notasRecepcionDataSource.data = [];
    this.itemsSelection.clear();
    this.selectedItemIds.clear(); // Clear ID-based selections too
    this.selectedNotaRecepcion = null;
    this.totalItems = 0;
    this.assignedItems = 0;
    this.pendingItems = 0;
    this.cancelledItems = 0;
    this.totalNotas = 0;
    this.itemsNeedingDistribution = 0;
    this.nonCancelledPendingItems = 0;
    this.updateComputedProperties();
  }

  private setupFormSubscriptions(): void {
    // Search items debounced
    this.searchItemsControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe(() => {
        this.loadPedidoItems();
      });

    // Search notas debounced
    this.searchNotasControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe(() => {
        this.loadNotasRecepcion();
      });
  }

  private setupPeriodicCleanup(): void {
    // **MEMORY MANAGEMENT**: Clean up selectedItemIds every 30 seconds to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      // Keep only IDs that are still present in current data
      const currentIds = new Set(this.pedidoItemsDataSource.data.map(item => item.id));
      const cleanedIds = new Set<number>();
      
      this.selectedItemIds.forEach(id => {
        if (currentIds.has(id)) {
          cleanedIds.add(id);
        }
      });
      
      // Only update if there's a difference to avoid unnecessary operations
      if (cleanedIds.size !== this.selectedItemIds.size) {
        this.selectedItemIds = cleanedIds;
      }
    }, 30000); // 30 seconds
  }

  private loadInitialData(): void {
    if (this.selectedPedido?.id) {
      this.loadPedidoItems();
      this.loadNotasRecepcion();
      this.updateSummary(); // Load summary from backend
      this.updateComputedProperties();
    }
  }

  loadPedidoItems(page = 0, size = 15): void {
    if (!this.selectedPedido?.id) return;

    this.isLoadingItems = true;
    const searchText = this.searchItemsControl.value || '';

    // Load items that can be assigned to notas (not assigned yet or need reassignment)
    this.pedidoService.onGetPedidoItemSobrantes(this.selectedPedido.id, page, size, searchText)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.pedidoItemsPage = response;
          
          // **OPTIMIZED**: Transform items with computed properties using estado-based field access
          const currentEstado = this.selectedPedido.estado;
          const itemsWithStatus: PedidoItemWithStatus[] = response.getContent.map(item => {
            // **OPTIMIZED**: Reuse existing instance to reduce object creation
            const pedidoItem = item instanceof PedidoItem ? item : Object.assign(new PedidoItem(), item);
            
            // **OPTIMIZED**: Cache estado-based field access calculations
            const presentacion = pedidoItem.getFieldValueForEstado('presentacion', currentEstado);
            const cantidad = pedidoItem.getFieldValueForEstado('cantidad', currentEstado);
            const precioUnitario = pedidoItem.getFieldValueForEstado('precioUnitario', currentEstado);
            const descuentoUnitario = pedidoItem.getFieldValueForEstado('descuentoUnitario', currentEstado);
            
            // **OPTIMIZED**: Calculate once instead of in template
            const displayValorTotal = presentacion && cantidad && precioUnitario 
              ? (cantidad * presentacion.cantidad * (precioUnitario - (descuentoUnitario || 0)))
              : item.valorTotal;
            
            // **OPTIMIZED**: Direct assignment instead of spread operator for better performance
            const itemWithStatus = pedidoItem as PedidoItemWithStatus;
            itemWithStatus.isAssigned = !!item.notaRecepcion;
            itemWithStatus.notaNumero = item.notaRecepcion?.numero;
            itemWithStatus.notaTipoBoleta = item.notaRecepcion?.tipoBoleta;
            itemWithStatus.displayPresentacion = presentacion;
            itemWithStatus.displayCantidad = cantidad;
            itemWithStatus.displayPrecioUnitario = precioUnitario;
            itemWithStatus.displayDescuentoUnitario = descuentoUnitario;
            itemWithStatus.displayValorTotal = displayValorTotal;
            
            return itemWithStatus;
          });

          this.pedidoItemsDataSource.data = itemsWithStatus;
          
          // Restore selections based on IDs after loading new page
          this.restoreSelections();
          
          // Update pagination
          if (this.itemsPaginator) {
            this.itemsPaginator.pageIndex = page;
            this.itemsPaginator.length = response.getTotalElements;
            this.itemsPaginator.pageSize = size;
          }

          // Don't call updateSummary() here - search/pagination doesn't change business data
          this.isLoadingItems = false;
        },
        error: () => {
          this.isLoadingItems = false;
          this.notificacionService.openWarn('Error al cargar items del pedido');
        }
      });
  }

  private restoreSelections(): void {
    this.itemsSelection.clear();
    this.pedidoItemsDataSource.data.forEach(item => {
      // Only allow selection of items that are not assigned (cancelled items can be selected)
      if (this.selectedItemIds.has(item.id) && !item.isAssigned) {
        this.itemsSelection.select(item);
      }
    });
    this.updateComputedProperties();
  }

  loadNotasRecepcion(page = 0, size = 10): void {
    if (!this.selectedPedido?.id) return;

    this.isLoadingNotas = true;
    const searchText = this.searchNotasControl.value || '';

    this.notaRecepcionService.onGetNotaRecepcionPorPedidoIdAndNumero(
      this.selectedPedido.id, 
      searchText ? parseInt(searchText) : null, 
      page, 
      size
    ).pipe(untilDestroyed(this))
    .subscribe({
      next: (response) => {
        this.notasRecepcionPage = response;
        this.notasRecepcionDataSource.data = response.getContent;
        
        // Update pagination
        if (this.notasPaginator) {
          this.notasPaginator.pageIndex = page;
          this.notasPaginator.length = response.getTotalElements;
          this.notasPaginator.pageSize = size;
        }

        // Don't call updateSummary() here - search/pagination doesn't change business data
        this.isLoadingNotas = false;
      },
      error: () => {
        this.isLoadingNotas = false;
        this.notificacionService.openWarn('Error al cargar notas de recepción');
      }
    });
  }

  private updateSummary(): void {
    // Load summary from backend
    if (this.selectedPedido?.id) {
      this.pedidoService.onGetPedidoRecepcionNotaSummary(this.selectedPedido.id)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (summary) => {
            this.totalItems = summary.totalItems;
            this.assignedItems = summary.assignedItems;
            this.pendingItems = summary.pendingItems;
            this.cancelledItems = summary.cancelledItems || 0; // Add cancelled items from summary
            this.totalNotas = summary.totalNotas;
            this.itemsNeedingDistribution = summary.itemsNeedingDistribution || 0;
            
            // **NEW**: Calculate non-cancelled pending items for step validation
            // ISSUE: Backend pendingItems calculation has a bug - it counts cancelled unassigned items as pending
            // For now, we'll calculate it correctly here: totalItems - assignedItems - cancelledItems
            this.nonCancelledPendingItems = Math.max(0, summary.totalItems - summary.assignedItems - (summary.cancelledItems || 0));
            
            // Update computed properties
            this.updateComputedProperties();

          },
          error: () => {
            console.warn('Could not load pedido recepcion nota summary');
            // Fallback to calculating from current data
            const currentItems = this.pedidoItemsDataSource.data;
            this.totalItems = currentItems.length;
            this.assignedItems = currentItems.filter(item => item.isAssigned).length;
            this.cancelledItems = currentItems.filter(item => item.cancelado).length;
            this.pendingItems = currentItems.filter(item => !item.isAssigned && !item.cancelado).length;
            this.totalNotas = this.notasRecepcionDataSource.data.length;
            this.itemsNeedingDistribution = 0; // Reset itemsNeedingDistribution
            // **NEW**: For fallback, calculate non-cancelled pending items correctly
            // The fallback already excludes cancelled items, so it's already correct
            this.nonCancelledPendingItems = this.pendingItems;
            this.updateComputedProperties();
          }
        });
    }
  }

  private updateComputedProperties(): void {
    // Call the debounced version to prevent excessive calls
    this.updateComputedPropertiesDebounced();
  }

  private updateComputedPropertiesImmediate(): void {
    // Basic computed properties
    this.monedaSymbol = this.selectedPedido?.moneda?.simbolo || 'Gs.';
    this.hasDataComputed = this.totalItems > 0 || this.totalNotas > 0;
    this.isProcessingComputed = this.isProcessing;
    this.canCreateNotaComputed = this.selectedPedido?.estado === 'ACTIVO' || this.selectedPedido?.estado === 'EN_RECEPCION_NOTA';
    
    // **UPDATED**: Allow assignment when there are selectable items (including cancelled items)
    // Use actual UI selection count, not selectedItemIds.size to avoid stale selection state
    const selectableItems = this.itemsSelection.selected.length;
    this.canAssignItemsComputed = this.selectedNotaRecepcion != null && selectableItems > 0;

    // **UPDATED**: Step validation - can proceed if no NON-CANCELLED pending items and no items needing distribution
    // Cancelled items are optional to assign, so they don't block progression
    const previousCanProceed = this.canProceedToNextStepComputed;
    this.canProceedToNextStepComputed = this.nonCancelledPendingItems === 0 && this.itemsNeedingDistribution === 0;
    
    // Emit step validation change if it changed
    if (previousCanProceed !== this.canProceedToNextStepComputed) {
      this.stepValidChange.emit(this.canProceedToNextStepComputed);
    }

    // **FIX**: Compute nota properties to avoid function calls in template
    this.notasWithComputedProperties = this.notasRecepcionDataSource.data.map(nota => ({
      ...nota,
      needsDistribution: (nota.cantidadItensNecesitanDistribucion || 0) > 0,
      isSelected: this.selectedNotaRecepcion?.id === nota.id,
      tooltipText: this.calculateNotaTooltip(nota),
      cssClasses: this.calculateNotaCssClasses(nota)
    }));

    // Existing item properties computation
    this.itemsWithComputedProperties = this.pedidoItemsDataSource.data.map(item => ({
      ...item,
      statusText: this.getItemStatusText(item),
      statusClass: this.getItemStatusClass(item),
      displayPresentacion: item.getFieldValueForEstado ? 
        item.getFieldValueForEstado('presentacion', this.selectedPedido?.estado) : 
        item.presentacionCreacion,
      displayCantidad: item.getFieldValueForEstado ? 
        item.getFieldValueForEstado('cantidad', this.selectedPedido?.estado) : 
        item.cantidadCreacion,
      displayPrecioUnitario: item.getFieldValueForEstado ? 
        item.getFieldValueForEstado('precioUnitario', this.selectedPedido?.estado) : 
        item.precioUnitarioCreacion,
      displayValorTotal: this.calculateItemTotal(item)
    }));

    // Manually trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  /**
   * Calculate tooltip text for nota (used in computed properties)
   */
  private calculateNotaTooltip(nota: NotaRecepcion): string {
    const isSelected = this.selectedNotaRecepcion?.id === nota.id;
    const needsDistribution = (nota.cantidadItensNecesitanDistribucion || 0) > 0;
    
    if (isSelected && needsDistribution) {
      return `Nota seleccionada - ${nota.cantidadItensNecesitanDistribucion} items necesitan distribución por sucursales`;
    } else if (isSelected) {
      return 'Nota seleccionada - Click para deseleccionar';
    } else if (needsDistribution) {
      return `Esta nota tiene ${nota.cantidadItensNecesitanDistribucion} items que necesitan distribución por sucursales`;
    } else {
      return 'Click para seleccionar esta nota';
    }
  }

  /**
   * Calculate CSS classes for nota (used in computed properties)
   */
  private calculateNotaCssClasses(nota: NotaRecepcion): string {
    const classes = ['clickable-row', 'nota-row'];
    
    if (this.selectedNotaRecepcion?.id === nota.id) {
      classes.push('selected-nota');
    }
    
    const needsDistribution = (nota.cantidadItensNecesitanDistribucion || 0) > 0;
    if (needsDistribution) {
      classes.push('needs-distribution');
    }
    
    return classes.join(' ');
  }

  /**
   * Get status text for item (used in computed properties)
   */
  private getItemStatusText(item: any): string {
      if (item.cancelado) {
      return 'CANCELADO';
      } else if (item.isAssigned) {
      return `Asig. a ${item.notaNumero}`;
    } else {
      return 'Pendiente';
    }
  }

  /**
   * Get status CSS class for item (used in computed properties)
   */
  private getItemStatusClass(item: any): string {
    if (item.cancelado) {
      return 'item-cancelled';
    } else if (item.isAssigned) {
      return 'item-assigned';
    } else {
      return 'item-pending';
    }
  }

  /**
   * Calculate total value for item (used in computed properties)
   */
  private calculateItemTotal(item: any): number {
    const presentacion = item.getFieldValueForEstado ? 
      item.getFieldValueForEstado('presentacion', this.selectedPedido?.estado) : 
      item.presentacionCreacion;
    const cantidad = item.getFieldValueForEstado ? 
      item.getFieldValueForEstado('cantidad', this.selectedPedido?.estado) : 
      item.cantidadCreacion;
    const precioUnitario = item.getFieldValueForEstado ? 
      item.getFieldValueForEstado('precioUnitario', this.selectedPedido?.estado) : 
      item.precioUnitarioCreacion;
    const descuentoUnitario = item.getFieldValueForEstado ? 
      item.getFieldValueForEstado('descuentoUnitario', this.selectedPedido?.estado) : 
      item.descuentoUnitarioCreacion || 0;

    if (presentacion && cantidad && precioUnitario) {
      return cantidad * presentacion.cantidad * (precioUnitario - descuentoUnitario);
    }
    return item.valorTotal || 0;
  }

  // Selection methods
  isAllSelected(): boolean {
    return this.allSelectedComputed;
  }

  masterToggle(): void {
    const unassignedItems = this.pedidoItemsDataSource.data.filter(item => !item.isAssigned);
    
    if (this.isAllSelected()) {
      // Clear selections for current page items
      unassignedItems.forEach(item => this.selectedItemIds.delete(item.id));
      this.itemsSelection.clear();
    } else {
      // Select all unassigned items on current page (including cancelled items)
      unassignedItems.forEach(item => this.selectedItemIds.add(item.id));
      unassignedItems.forEach(item => this.itemsSelection.select(item));
    }
    
    // Update computed properties after selection change
    this.updateComputedProperties();
  }

  toggleItemSelection(item: PedidoItemWithStatus): void {
    // Only allow selection of items that are not assigned (cancelled items can be selected)
    if (!item.isAssigned) {
      if (this.selectedItemIds.has(item.id)) {
        // Deselect item
        this.selectedItemIds.delete(item.id);
        this.itemsSelection.deselect(item);
      } else {
        // Select item
        this.selectedItemIds.add(item.id);
        this.itemsSelection.select(item);
      }
      // Update computed properties after selection change
      this.updateComputedProperties();
    }
  }

  // Dialog methods
  openCrearNotaDialog(): void {
    const dialogRef = this.dialog.open(CrearNotaRecepcionDialogComponent, {
      width: '50%',
      height: '80%',
      data: {
        pedido: this.selectedPedido,
        selectedItems: this.itemsSelection.selected
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.notaCreated) {
        this.notificacionService.openSucess('Nota de recepción creada exitosamente');
        
        // Clear both selection models after successful creation
        this.selectedItemIds.clear();
        this.itemsSelection.clear();
        
        // Refresh data and summary
        this.loadPedidoItems();
        this.loadNotasRecepcion();
        // Add delay to ensure database changes are committed
        setTimeout(() => {
          this.updateSummary(); // Refresh summary from backend
        }, 500);
        this.selectedNotaRecepcion = null;
        this.isProcessing = false;
        
        // Emit pedido change to update parent component
        this.pedidoChange.emit(this.selectedPedido);
      }
    });
  }

  onCrearNotaVacia(): void {
    const dialogRef = this.dialog.open(CrearNotaRecepcionDialogComponent, {
      width: '50%',
      height: '80%',
      data: {
        pedido: this.selectedPedido,
        selectedItems: [] // Empty array - no items selected
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.notaCreated) {
        this.notificacionService.openSucess('Nota de recepción creada exitosamente');
        
        // Refresh data and summary
        this.loadPedidoItems();
        this.loadNotasRecepcion();
        // Add delay to ensure database changes are committed
        setTimeout(() => {
          this.updateSummary(); // Refresh summary from backend
        }, 500);
        
        // Emit pedido change to update parent component
        this.pedidoChange.emit(this.selectedPedido);
      }
    });
  }

  onAsignarItemsANota(): void {
    if (this.selectedItemIds.size === 0) {
      this.notificacionService.openWarn('Seleccione al menos un item para asignar');
      return;
    }

    if (!this.selectedNotaRecepcion) {
      this.notificacionService.openWarn('Seleccione una nota de recepción');
      return;
    }

    const selectedItemIds = Array.from(this.selectedItemIds);
    
    this.isProcessing = true;
    
    // Process items assignment
    this.asignarItemsANota(selectedItemIds, this.selectedNotaRecepcion.id)
      .then(() => {
        this.notificacionService.openSucess(`${selectedItemIds.length} items asignados a la nota ${this.selectedNotaRecepcion.numero}`);
        
        // Clear both selection models after successful assignment
        this.selectedItemIds.clear();
        this.itemsSelection.clear();
        
        // Refresh data and summary
        this.loadPedidoItems();
        this.loadNotasRecepcion();
        // Add delay to ensure database changes are committed
        setTimeout(() => {
          this.updateSummary(); // Refresh summary from backend
        }, 500);
        this.selectedNotaRecepcion = null;
        this.isProcessing = false;
        
        // Emit pedido change
        this.pedidoChange.emit(this.selectedPedido);
      })
      .catch(() => {
        this.isProcessing = false;
        this.notificacionService.openWarn('Error al asignar items a la nota');
      });
  }

  private async asignarItemsANota(itemIds: number[], notaRecepcionId: number): Promise<void> {
    // The backend addPedidoItemToNotaRecepcion method already handles copying data from 
    // Creacion fields to RecepcionNota fields automatically, so we don't need to do it here
    for (const itemId of itemIds) {
      await this.pedidoService.onAddPedidoItemToNotaRecepcion(notaRecepcionId, itemId).toPromise();
    }
  }

  onDesasignarItem(item: PedidoItemWithStatus): void {
    if (!item.isAssigned || !item.notaRecepcion) return;

    const message = `¿Desea desasignar este item de la nota ${item.notaRecepcion.numero}?`;
    
    this.dialogosService.confirm('Confirmar desasignación', message)
      .subscribe(confirmed => {
        if (confirmed) {
          // The backend automatically clears all RecepcionNota data when unassigning (notaRecepcionId = null)
          this.pedidoService.onAddPedidoItemToNotaRecepcion(null, item.id)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: () => {
                this.notificacionService.openSucess('Item desasignado exitosamente');
                
                // Refresh data and summary
                this.loadPedidoItems();
                this.loadNotasRecepcion();
                // Add delay to ensure database changes are committed
                setTimeout(() => {
                  this.updateSummary(); // Refresh summary from backend
                }, 500);
                
                // Emit pedido change
                this.pedidoChange.emit(this.selectedPedido);
              },
              error: () => {
                this.notificacionService.openWarn('Error al desasignar item');
              }
            });
        }
      });
  }

  onEditarNota(nota: NotaRecepcion): void {
    // Open edit dialog
    const dialogRef = this.dialog.open(CrearNotaRecepcionDialogComponent, {
      width: '50%',
      height: '80%',
      data: {
        pedido: this.selectedPedido,
        notaRecepcion: nota,
        isEditing: true
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.notaUpdated) {
        this.notificacionService.openSucess('Nota de recepción actualizada exitosamente');
        this.loadNotasRecepcion();
        
        // Emit pedido change
        this.pedidoChange.emit(this.selectedPedido);
      }
    });
  }

  onEliminarNota(nota: NotaRecepcion): void {
    const message = `¿Está seguro que desea eliminar la nota de recepción ${nota.numero}?\n\nTodos los items asignados a esta nota quedarán sin asignar y se limpiarán automáticamente sus datos de recepción.`;
    
    this.dialogosService.confirm('Confirmar eliminación', message)
      .subscribe(confirmed => {
        if (confirmed) {
          // The backend now handles clearing all items' RecepcionNota data automatically
          this.notaRecepcionService.onDeleteNotaRecepcion(nota.id)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: () => {
                this.notificacionService.openSucess('Nota de recepción eliminada exitosamente');
                
                // Refresh data and summary
                this.loadPedidoItems();
                this.loadNotasRecepcion();
                // Add delay to ensure database changes are committed
                setTimeout(() => {
                  this.updateSummary(); // Refresh summary from backend
                }, 500);
                
                // Emit pedido change
                this.pedidoChange.emit(this.selectedPedido);
              },
              error: () => {
                this.notificacionService.openWarn('Error al eliminar nota de recepción');
              }
            });
        }
      });
  }

  onGestionarItems(nota: NotaRecepcion): void {
    if (!nota || !this.selectedPedido) {
      this.notificacionService.openWarn('Error: Nota o pedido no disponible');
      return;
    }

    const dialogRef = this.dialog.open(ManageNotaItemsDialogComponent, {
      width: '95vw',
      height: '90vh',
      maxWidth: '1400px',
      data: {
        notaRecepcion: nota,
        pedido: this.selectedPedido
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.editItem) {
        // Handle edit intent: open add-product-dialog with the item
        this.openAddProductDialogForEdit(result.editItem, nota);
      } else if (result?.itemsChanged) {
        this.notificacionService.openSucess('Items gestionados exitosamente');
        
        // Refresh data and summary
        this.loadPedidoItems();
        this.loadNotasRecepcion();
        // Add delay to ensure database changes are committed
        setTimeout(() => {
          this.updateSummary(); // Refresh summary from backend
        }, 500);
        
        // Emit pedido change to update parent component
        this.pedidoChange.emit(this.selectedPedido);
      }
    });
  }

  private openAddProductDialogForEdit(itemWithStatus: any, nota: NotaRecepcion): void {
    // Convert the item data to PedidoItem format
    const pedidoItem = new PedidoItem();
    pedidoItem.id = itemWithStatus.id;
    pedidoItem.pedido = this.selectedPedido; // Ensure pedido is set
    pedidoItem.producto = itemWithStatus.producto;
    pedidoItem.estado = itemWithStatus.estado;
    pedidoItem.valorTotal = itemWithStatus.valorTotal;
    
    // **FIX ISSUE 1**: Set the notaRecepcion reference if the item is assigned
    if (itemWithStatus.status === 'assigned' && itemWithStatus.notaRecepcionId) {
      pedidoItem.notaRecepcion = nota; // Set the full NotaRecepcion object
    }
    
    // Explicitly set all the estado-based fields from the original item
    // This ensures the PedidoItem has all the data it needs
    pedidoItem.presentacionCreacion = itemWithStatus.presentacionCreacion;
    pedidoItem.cantidadCreacion = itemWithStatus.cantidadCreacion;
    pedidoItem.precioUnitarioCreacion = itemWithStatus.precioUnitarioCreacion;
    pedidoItem.descuentoUnitarioCreacion = itemWithStatus.descuentoUnitarioCreacion;
    pedidoItem.obsCreacion = itemWithStatus.obsCreacion;
    
    // Set RecepcionNota fields if they exist
    if (itemWithStatus.presentacionRecepcionNota) {
      pedidoItem.presentacionRecepcionNota = itemWithStatus.presentacionRecepcionNota;
    }
    if (itemWithStatus.cantidadRecepcionNota !== undefined) {
      pedidoItem.cantidadRecepcionNota = itemWithStatus.cantidadRecepcionNota;
    }
    if (itemWithStatus.precioUnitarioRecepcionNota !== undefined) {
      pedidoItem.precioUnitarioRecepcionNota = itemWithStatus.precioUnitarioRecepcionNota;
    }
    if (itemWithStatus.descuentoUnitarioRecepcionNota !== undefined) {
      pedidoItem.descuentoUnitarioRecepcionNota = itemWithStatus.descuentoUnitarioRecepcionNota;
    }
    if (itemWithStatus.obsRecepcionNota) {
      pedidoItem.obsRecepcionNota = itemWithStatus.obsRecepcionNota;
    }
    
    // Set RecepcionProducto fields if they exist
    if (itemWithStatus.presentacionRecepcionProducto) {
      pedidoItem.presentacionRecepcionProducto = itemWithStatus.presentacionRecepcionProducto;
    }
    if (itemWithStatus.cantidadRecepcionProducto !== undefined) {
      pedidoItem.cantidadRecepcionProducto = itemWithStatus.cantidadRecepcionProducto;
    }
    if (itemWithStatus.precioUnitarioRecepcionProducto !== undefined) {
      pedidoItem.precioUnitarioRecepcionProducto = itemWithStatus.precioUnitarioRecepcionProducto;
    }
    if (itemWithStatus.descuentoUnitarioRecepcionProducto !== undefined) {
      pedidoItem.descuentoUnitarioRecepcionProducto = itemWithStatus.descuentoUnitarioRecepcionProducto;
    }
    if (itemWithStatus.obsRecepcionProducto) {
      pedidoItem.obsRecepcionProducto = itemWithStatus.obsRecepcionProducto;
    }

    // Ensure the product has presentaciones loaded for mat-select
    if (pedidoItem.producto && !pedidoItem.producto.presentaciones) {
      console.warn('Product presentaciones not loaded, will be loaded by add-product-dialog');
    }

    const dialogData: AddProductDialogData = {
      pedido: this.selectedPedido,
      pedidoItem: pedidoItem,
      isEditing: true,
      currentStep: this.getCurrentStep()
    };

    const dialogRef = this.dialog.open(AddProductDialogComponent, {
      data: dialogData,
      width: '95vw',
      maxWidth: '1400px',
      height: '90vh'
    });

    dialogRef.afterClosed().subscribe((result: AddProductDialogResult) => {
      if (result?.needsUIRefresh) {
        // Refresh all data
        this.loadPedidoItems();
        this.loadNotasRecepcion();
        
        // Add delay before updating summary to ensure database changes are committed
        setTimeout(() => {
          this.updateSummary();
        }, 500);
        
        this.pedidoChange.emit(this.selectedPedido);
        
        // Optionally reopen the manage dialog
        this.showReOpenManageDialogOption(nota);
      }
    });
  }

  private getCurrentStep(): PedidoStep {
    return PedidoStep.RECEPCION_NOTA;
  }

  private showReOpenManageDialogOption(nota: NotaRecepcion): void {
    this.dialogosService.confirm(
      'Gestionar Items',
      '¿Desea volver a abrir el gestor de items para continuar gestionando?'
    ).subscribe(reopen => {
      if (reopen) {
        // Small delay to ensure data is refreshed
        setTimeout(() => {
          this.onGestionarItems(nota);
        }, 500);
      }
    });
  }

  onSelectNota(nota: NotaRecepcion): void {
    const wasSelected = this.selectedNotaRecepcion?.id === nota.id;
    
    if (wasSelected) {
      // Deselecting current nota
      this.selectedNotaRecepcion = null;
      this.notificacionService.openWarn(`Nota ${nota.numero} deseleccionada`);
    } else {
      // Selecting new nota
      this.selectedNotaRecepcion = nota;
      this.notificacionService.openSucess(`Nota ${nota.numero} seleccionada para asignación de items`);
    }
    
    // Update computed properties after nota selection change
    this.updateComputedProperties();
  }

  // Pagination handlers
  onItemsPageChange(event: any): void {
    this.loadPedidoItems(event.pageIndex, event.pageSize);
  }

  onNotasPageChange(event: any): void {
    this.loadNotasRecepcion(event.pageIndex, event.pageSize);
  }

  // Item split functionality
  onDividirItem(item: PedidoItemWithStatus): void {
    if (item.isAssigned) {
      this.notificacionService.openWarn('No se puede dividir un item ya asignado a una nota de recepción');
      return;
    }

    const dialogRef = this.dialog.open(DividirItemDialogComponent, {
      width: '80%',
      height: '70%',
      data: {
        pedido: this.selectedPedido,
        pedidoItem: item,
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((dividirRes: PedidoItem[]) => {
      if (dividirRes != null && dividirRes.length > 0) {
        this.notificacionService.openSucess(`Item dividido en ${dividirRes.length} partes exitosamente`);
        
        // Refresh data and summary
        this.loadPedidoItems();
        this.loadNotasRecepcion();
        this.updateSummary(); // Refresh summary from backend
        
        // Emit pedido change to update parent component
        this.pedidoChange.emit(this.selectedPedido);
      }
    });
  }

  // Method to open edit dialog for pedido item in recepcion nota step
  onEditarItem(item: PedidoItemWithStatus): void {
    if (!this.selectedPedido || !item) {
      this.notificacionService.openWarn('Error: Pedido o item no disponible');
      return;
    }

    const dialogData: AddProductDialogData = {
      pedido: this.selectedPedido,
      pedidoItem: item,
      isEditing: true,
      currentStep: PedidoStep.RECEPCION_NOTA
    };

    const dialogRef = this.dialog.open(AddProductDialogComponent, {
      data: dialogData,
      width: '90%',
      maxWidth: '1200px',
      height: '80%',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: AddProductDialogResult | undefined) => {
      // Handle the new comprehensive result structure
      if (result && !result.cancelled && result.needsUIRefresh) {
        // Show appropriate success message based on what changed
        if (result.updated) {
          this.notificacionService.openSucess('Item actualizado en recepción de nota');
        }
        
        // Handle specific changes with targeted updates
        if (result.productConfigurationChanged) {
          // Product configuration changes affect items display and totals
          this.loadPedidoItems();
          // Add delay to ensure database changes are committed
          setTimeout(() => {
            this.updateSummary();
          }, 500);
        }
        
        if (result.rejectionStatusChanged || result.itemCancellationChanged) {
          // Rejection/cancellation changes affect items display, summary, and selection state
          this.loadPedidoItems();
          // Add delay to ensure database changes are committed
          setTimeout(() => {
            this.updateSummary();
          }, 500);
          // Note: Cancelled items can still be selected for assignment to NotaRecepcion
        }
        
        if (result.sucursalDistributionChanged) {
          // Distribution changes only affect items display
          this.loadPedidoItems();
        }
        
        // If no specific changes detected but item was updated, do minimal refresh
        if (result.updated && !result.productConfigurationChanged && 
            !result.rejectionStatusChanged && !result.itemCancellationChanged && 
            !result.sucursalDistributionChanged) {
          this.loadPedidoItems();
          // Add delay to ensure database changes are committed
          setTimeout(() => {
            this.updateSummary();
          }, 500);
        }
        
        // Check if distribution update is needed (presentacion or cantidad changed)
        if (result.needsDistributionUpdate) {
          this.openSucursalDistributionDialog(result.pedidoItem!);
        }
        
        // Always emit pedido change for parent component updates
        this.pedidoChange.emit(this.selectedPedido);
      } else if (result?.cancelled) {
      }
    });
  }

  // Method to open pedido item sucursal distribution dialog
  private openSucursalDistributionDialog(pedidoItem: PedidoItem): void {
    // Get sucursal data from pedido
    const sucursalInfluenciaList = this.selectedPedido?.sucursalInfluenciaList || [];
    const sucursalEntregaList = this.selectedPedido?.sucursalEntregaList || [];

    if (sucursalInfluenciaList.length === 0) {
      this.notificacionService.openWarn('No hay sucursales de influencia configuradas para este pedido');
      return;
    }

    const dialogRef = this.dialog.open(PedidoItemSucursalDialogComponent, {
      width: '90%',
      maxWidth: '1000px',
      height: '80%',
      data: {
        pedidoItem: pedidoItem,
        sucursalInfluenciaList: sucursalInfluenciaList,
        sucursalEntregaList: sucursalEntregaList,
        autoSet: false
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notificacionService.openSucess('Distribución por sucursales actualizada');
        
        // Reload data to reflect any changes
        this.loadPedidoItems();
        // Add delay to ensure database changes are committed
        setTimeout(() => {
          this.updateSummary();
        }, 500);
        
        // Emit pedido change
        this.pedidoChange.emit(this.selectedPedido);
      }
    });
  }

  // Method to add new item in recepcion nota step
  onAgregarItem(): void {
    if (!this.selectedPedido) {
      this.notificacionService.openWarn('Error: Pedido no disponible');
      return;
    }

    const dialogData: AddProductDialogData = {
      pedido: this.selectedPedido,
      isEditing: false,
      currentStep: PedidoStep.RECEPCION_NOTA
    };

    const dialogRef = this.dialog.open(AddProductDialogComponent, {
      data: dialogData,
      width: '90%',
      maxWidth: '1200px',
      height: '80%',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: AddProductDialogResult | undefined) => {
      // Handle the new comprehensive result structure
      if (result && !result.cancelled && result.needsUIRefresh) {
        // Show appropriate success message based on what changed
        if (result.added) {
          this.notificacionService.openSucess('Nuevo item agregado en recepción de nota');
        }
        
        // New items always require full refresh of items and summary
        this.loadPedidoItems();
        // Add delay to ensure database changes are committed
        setTimeout(() => {
          this.updateSummary();
        }, 500);
        
        // Always emit pedido change for parent component updates
        this.pedidoChange.emit(this.selectedPedido);
      } else if (result?.cancelled) {
      }
    });
  }

  /**
   * Clear selections for items that have been assigned to a nota recepcion
   * since assigned items cannot be selected again
   */
  private clearSelectionsForAssignedItems(): void {
    // Get current data to check for assigned items
    const currentItems = this.pedidoItemsDataSource.data;
    const assignedItemIds = currentItems
      .filter(item => item.isAssigned)
      .map(item => item.id);
    
    // Remove assigned items from selections
    assignedItemIds.forEach(id => {
      this.selectedItemIds.delete(id);
      const item = currentItems.find(i => i.id === id);
      if (item) {
        this.itemsSelection.deselect(item);
      }
    });
    
    // Update computed properties after selection changes
    this.updateComputedProperties();
  }

  // Method to open item rejection dialog
  onGestionarRechazoItem(item: PedidoItemWithStatus): void {
    if (!item) {
      this.notificacionService.openWarn('Error: Item no disponible');
      return;
    }

    const dialogData: ItemStatusDialogData = {
      pedidoItem: item,
      isReadOnly: false
    };

    const dialogRef = this.dialog.open(ItemStatusDialogComponent, {
      data: dialogData,
      width: '50%',
      maxWidth: '80%',
      height: '70%',
      maxHeight: '90vh',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.updated) {
        this.notificacionService.openSucess('Estado de rechazo actualizado exitosamente');
        
        // Targeted refresh - rejection status changes affect items display and summary
        this.loadPedidoItems();
        // Add delay to ensure database changes are committed
        setTimeout(() => {
          this.updateSummary();
        }, 500);
        
        // Note: Cancelled items can still be selected for assignment to NotaRecepcion
        
        // Emit pedido change to update parent component
        this.pedidoChange.emit(this.selectedPedido);
      }
    });
  }

  // Method to view item rejection status (read-only)
  onVerRechazoItem(item: PedidoItemWithStatus): void {
    if (!item) {
      this.notificacionService.openWarn('Error: Item no disponible');
      return;
    }

    const dialogData: ItemStatusDialogData = {
      pedidoItem: item,
      isReadOnly: true
    };

    this.dialog.open(ItemStatusDialogComponent, {
      data: dialogData,
      width: '600px',
      maxWidth: '90vw',
      height: '70%',
      maxHeight: '90vh',
      disableClose: false
    });
  }

  // Utility methods
  getMonedaSymbol(): string {
    return this.selectedPedido?.moneda?.simbolo || 'Gs.';
  }
} 