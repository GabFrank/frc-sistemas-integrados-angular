import { Component, Inject, OnInit, ViewChild, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { NotaRecepcion } from '../../../nota-recepcion/nota-recepcion.model';
import { Pedido } from '../../../edit-pedido/pedido.model';
import { PedidoItem } from '../../../edit-pedido/pedido-item.model';
import { PedidoItemEstado } from '../../../edit-pedido/pedido-enums';
import { NotaRecepcionService } from '../../../nota-recepcion/nota-recepcion.service';
import { PedidoService } from '../../../pedido.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../../shared/components/dialogos/dialogos.service';
import { PageInfo } from '../../../../../../app.component';

export interface ManageNotaItemsDialogData {
  notaRecepcion: NotaRecepcion;
  pedido: Pedido;
  readOnlyMode?: boolean;
}

export interface ManageNotaItemsDialogResult {
  itemsChanged?: boolean;
  editItem?: PedidoItemWithStatus;
}

interface PedidoItemWithStatus extends PedidoItem {
  // Status-specific fields
  status: 'assigned' | 'unassigned';
  notaRecepcionId?: number;
  
  // Estado-based display fields (computed properties for template usage)
  displayPresentacion: any;
  displayCantidad: number;
  displayPrecioUnitario: number;
  displayValorTotal: number;
  displayEstado: string;
  displayEstadoColorClass: string;
  
  // Distribution status fields
  isDistribucionSucursalesCreacion: boolean;
  isDistribucionSucursalesRecepcion: boolean;
  displayDistributionStatus: string;
  displayDistributionStatusClass: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-manage-nota-items-dialog',
  templateUrl: './manage-nota-items-dialog.component.html',
  styleUrls: ['./manage-nota-items-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageNotaItemsDialogComponent implements OnInit, OnDestroy {
  
  @ViewChild('assignedPaginator') assignedPaginator: MatPaginator;
  @ViewChild('unassignedPaginator') unassignedPaginator: MatPaginator;

  // Data
  notaRecepcion: NotaRecepcion;
  pedido: Pedido;
  readOnlyMode = false;
  
  // Table data sources
  assignedItemsDataSource = new MatTableDataSource<PedidoItemWithStatus>([]);
  unassignedItemsDataSource = new MatTableDataSource<PedidoItemWithStatus>([]);
  
  // Table columns - add estado and distribution columns
  assignedItemsColumns = ['select', 'producto', 'estado', 'presentacion', 'cantidad', 'precio', 'total', 'distribution', 'actions'];
  unassignedItemsColumns = ['select', 'producto', 'estado', 'presentacion', 'cantidad', 'precio', 'total', 'distribution', 'actions'];
  
  // Computed columns based on read-only mode
  assignedItemsColumnsComputed: string[] = [];
  unassignedItemsColumnsComputed: string[] = [];
  
  // Selection models
  assignedSelection = new SelectionModel<PedidoItemWithStatus>(true, []);
  unassignedSelection = new SelectionModel<PedidoItemWithStatus>(true, []);
  
  // ID-based selection tracking for persistence across pagination
  selectedAssignedIds: Set<number> = new Set();
  selectedUnassignedIds: Set<number> = new Set();
  
  // Search controls
  assignedSearchControl = new FormControl('');
  unassignedSearchControl = new FormControl('');
  
  // Pagination
  assignedPage: PageInfo<PedidoItemWithStatus>;
  unassignedPage: PageInfo<PedidoItemWithStatus>;
  
  // Loading states
  isLoadingAssigned = false;
  isLoadingUnassigned = false;
  isProcessing = false;
  
  // Computed properties for template
  monedaSymbolComputed = 'Gs.';
  dialogTitleComputed = '';
  assignedTotalValueComputed = 0;
  unassignedTotalValueComputed = 0;
  assignedCountComputed = 0;
  unassignedCountComputed = 0;
  selectedAssignedCountComputed = 0;
  selectedUnassignedCountComputed = 0;
  canRemoveItemsComputed = false;
  canAddItemsComputed = false;
  hasDataComputed = false;

  // **PERFORMANCE**: Cache for expensive estado calculations
  private estadoCalculationCache = new Map<string, any>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ManageNotaItemsDialogData,
    private dialogRef: MatDialogRef<ManageNotaItemsDialogComponent>,
    private notaRecepcionService: NotaRecepcionService,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private cdr: ChangeDetectorRef
  ) {
    this.notaRecepcion = data.notaRecepcion;
    this.pedido = data.pedido;
    this.readOnlyMode = data.readOnlyMode || false;
  }

  ngOnDestroy(): void {
    // **MEMORY CLEANUP**: Clear caches to prevent memory leaks
    this.estadoCalculationCache.clear();
    this.selectedAssignedIds.clear();
    this.selectedUnassignedIds.clear();
    this.assignedItemsDataSource.data = [];
    this.unassignedItemsDataSource.data = [];
  }

  ngOnInit(): void {
    this.setupSearchSubscriptions();
    this.setupDialogCloseHandlers();
    this.loadItemsData().then(() => {
      this.updateComputedProperties();
    }).catch(() => {
      // Error already handled in loadItemsData
    });
  }

  private setupSearchSubscriptions(): void {
    // Assigned items search
    this.assignedSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), untilDestroyed(this))
      .subscribe(() => {
        this.loadAssignedItems();
      });

    // Unassigned items search
    this.unassignedSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), untilDestroyed(this))
      .subscribe(() => {
        this.loadUnassignedItems();
      });
  }

  private setupDialogCloseHandlers(): void {
    // Handle backdrop click
    this.dialogRef.backdropClick().subscribe(() => {
      this.dialogRef.close({ itemsChanged: true });
    });

    // Handle ESC key press
    this.dialogRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        this.dialogRef.close({ itemsChanged: true });
      }
    });
  }

  private loadItemsData(): Promise<void> {
    return new Promise((resolve, reject) => {
      let assignedComplete = false;
      let unassignedComplete = false;
      let hasError = false;

      const checkComplete = () => {
        if (assignedComplete && unassignedComplete) {
          if (hasError) {
            reject(new Error('Error loading data'));
          } else {
            resolve();
          }
        }
      };

      // Load assigned items
      this.loadAssignedItemsInternal().then(() => {
        assignedComplete = true;
        checkComplete();
      }).catch(() => {
        hasError = true;
        assignedComplete = true;
        checkComplete();
      });

      // Load unassigned items  
      this.loadUnassignedItemsInternal().then(() => {
        unassignedComplete = true;
        checkComplete();
      }).catch(() => {
        hasError = true;
        unassignedComplete = true;
        checkComplete();
      });
    });
  }

  private loadAssignedItemsInternal(page = 0, size = 10): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isLoadingAssigned = true;
      const searchText = this.assignedSearchControl.value || '';
      
      this.pedidoService.onGetPedidoItemPorNotaRecepcion(this.notaRecepcion.id, page, size, searchText)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (response) => {
            // Transform items with estado-based computed properties
            const itemsWithStatus = response.getContent.map(item => this.transformItemWithStatus(item, 'assigned'));
            
            this.assignedPage = {
              ...response,
              getContent: itemsWithStatus
            };
            this.assignedItemsDataSource.data = itemsWithStatus;
            this.restoreAssignedSelections();
            this.isLoadingAssigned = false;
            this.updateComputedProperties();
            resolve();
          },
          error: (error) => {
            this.isLoadingAssigned = false;
            this.notificacionService.openWarn('Error al cargar items asignados');
            reject(error);
          }
        });
    });
  }

  private loadUnassignedItemsInternal(page = 0, size = 10): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isLoadingUnassigned = true;
      const searchText = this.unassignedSearchControl.value || '';
      
      this.pedidoService.onGetPedidoItemSobrantes(this.pedido.id, page, size, searchText)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (response) => {
            // Transform items with estado-based computed properties
            const itemsWithStatus = response.getContent.map(item => this.transformItemWithStatus(item, 'unassigned'));
            
            this.unassignedPage = {
              ...response,
              getContent: itemsWithStatus
            };
            this.unassignedItemsDataSource.data = itemsWithStatus;
            this.restoreUnassignedSelections();
            this.isLoadingUnassigned = false;
            this.updateComputedProperties();
            resolve();
          },
          error: (error) => {
            this.isLoadingUnassigned = false;
            this.notificacionService.openWarn('Error al cargar items disponibles');
            reject(error);
          }
        });
    });
  }

  /**
   * Transform a PedidoItem into PedidoItemWithStatus with estado-based computed properties
   * **OPTIMIZED**: With caching and reduced object creation
   */
  private transformItemWithStatus(item: any, status: 'assigned' | 'unassigned'): PedidoItemWithStatus {
    
    // **PERFORMANCE**: Check cache first to avoid expensive calculations
    const cacheKey = `${item.id}-${status}-${this.pedido.estado}`;
    if (this.estadoCalculationCache.has(cacheKey)) {
      return this.estadoCalculationCache.get(cacheKey);
    }
    
    // **OPTIMIZED**: Reuse existing instance if possible
    const pedidoItem = item instanceof PedidoItem ? item : Object.assign(new PedidoItem(), item);
    
    // **OPTIMIZED**: Cache estado for reuse
    const currentEstado = this.pedido.estado;
    
    // Get estado-based field values - if helper method fails, fall back to direct field access
    let presentacion, cantidad, precioUnitario, descuentoUnitario;
    
    try {
      presentacion = pedidoItem.getFieldValueForEstado('presentacion', currentEstado);
      cantidad = pedidoItem.getFieldValueForEstado('cantidad', currentEstado);
      precioUnitario = pedidoItem.getFieldValueForEstado('precioUnitario', currentEstado);
      descuentoUnitario = pedidoItem.getFieldValueForEstado('descuentoUnitario', currentEstado) || 0;
    } catch (error) {
      console.warn('Error using getFieldValueForEstado, falling back to direct field access:', error);
      
      // **OPTIMIZED**: Switch statement with cached estado
      switch (currentEstado) {
        case 'EN_RECEPCION_NOTA':
          presentacion = item.presentacionRecepcionNota || item.presentacionCreacion;
          cantidad = item.cantidadRecepcionNota || item.cantidadCreacion;
          precioUnitario = item.precioUnitarioRecepcionNota || item.precioUnitarioCreacion;
          descuentoUnitario = item.descuentoUnitarioRecepcionNota || item.descuentoUnitarioCreacion || 0;
          break;
        case 'EN_RECEPCION_MERCADERIA':
        case 'CONCLUIDO':
          presentacion = item.presentacionRecepcionProducto || item.presentacionRecepcionNota || item.presentacionCreacion;
          cantidad = item.cantidadRecepcionProducto || item.cantidadRecepcionNota || item.cantidadCreacion;
          precioUnitario = item.precioUnitarioRecepcionProducto || item.precioUnitarioRecepcionNota || item.precioUnitarioCreacion;
          descuentoUnitario = item.descuentoUnitarioRecepcionProducto || item.descuentoUnitarioRecepcionNota || item.descuentoUnitarioCreacion || 0;
          break;
        default:
          // ABIERTO, ACTIVO, etc.
          presentacion = item.presentacionCreacion;
          cantidad = item.cantidadCreacion;
          precioUnitario = item.precioUnitarioCreacion;
          descuentoUnitario = item.descuentoUnitarioCreacion || 0;
          break;
      }
    }
   
    // **OPTIMIZED**: Calculate once instead of in template
    const displayValorTotal = presentacion && cantidad && precioUnitario 
      ? (cantidad * presentacion.cantidad * (precioUnitario - descuentoUnitario))
      : item.valorTotal;

    // **OPTIMIZED**: Simplified distribution status logic
    const needsDistribution = item.needsDistribucion;
    const distributionStatus = needsDistribution ? 'Pendiente' : 'Completa';
    const distributionStatusClass = needsDistribution ? 'distribution-pending' : 'distribution-complete';

    // **CRITICAL FIX**: Preserve ALL PedidoItem fields for add-product-dialog compatibility
    // Create a complete PedidoItemWithStatus that includes all original PedidoItem data
    const result: PedidoItemWithStatus = {
      // Copy all original PedidoItem properties first
      ...item,
      
      // Override with status-specific properties
      status,
      notaRecepcionId: status === 'assigned' ? this.notaRecepcion.id : undefined,
      
      // Add computed display properties for template usage
      displayPresentacion: presentacion,
      displayCantidad: cantidad,
      displayPrecioUnitario: precioUnitario,
      displayValorTotal: displayValorTotal,
      displayEstado: item.cancelado ? 'Cancelado' : 'Activo',
      displayEstadoColorClass: item.cancelado ? 'estado-cancelado' : 'estado-activo',
      
      // Add distribution status fields
      isDistribucionSucursalesCreacion: item.isDistribucionSucursalesCreacion || false,
      isDistribucionSucursalesRecepcion: item.isDistribucionSucursalesRecepcion || false,
      displayDistributionStatus: distributionStatus,
      displayDistributionStatusClass: distributionStatusClass
    };
    
    // **PERFORMANCE**: Cache the result for future use
    this.estadoCalculationCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Get display text for PedidoItemEstado
   */
  private getEstadoDisplayText(estado: PedidoItemEstado | string): string {
    const estadoStr = typeof estado === 'string' ? estado : String(estado);
    switch (estadoStr) {
      case 'ACTIVO':
      case PedidoItemEstado.ACTIVO:
        return 'Activo';
      case 'CANCELADO':
      case PedidoItemEstado.CANCELADO:
        return 'Cancelado';
      case 'DEVOLUCION':
      case PedidoItemEstado.DEVOLUCION:
        return 'Devolución';
      case 'CONCLUIDO':
      case PedidoItemEstado.CONCLUIDO:
        return 'Concluido';
      case 'EN_FALTA':
      case PedidoItemEstado.EN_FALTA:
        return 'En Falta';
      default:
        console.warn('Unknown estado:', estado);
        return 'Desconocido';
    }
  }

  private loadAssignedItems(page = 0, size = 10): void {
    this.loadAssignedItemsInternal(page, size).catch(() => {
      // Error already handled in the internal method
    });
  }

  private loadUnassignedItems(page = 0, size = 10): void {
    this.loadUnassignedItemsInternal(page, size).catch(() => {
      // Error already handled in the internal method
    });
  }

  // Selection management methods
  private restoreAssignedSelections(): void {
    this.assignedSelection.clear();
    this.assignedItemsDataSource.data.forEach(item => {
      if (this.selectedAssignedIds.has(item.id)) {
        this.assignedSelection.select(item);
      }
    });
    this.updateComputedProperties();
  }

  private restoreUnassignedSelections(): void {
    this.unassignedSelection.clear();
    this.unassignedItemsDataSource.data.forEach(item => {
      if (this.selectedUnassignedIds.has(item.id)) {
        this.unassignedSelection.select(item);
      }
    });
    this.updateComputedProperties();
  }

  onAssignedItemToggle(item: PedidoItemWithStatus): void {
    if (this.selectedAssignedIds.has(item.id)) {
      this.selectedAssignedIds.delete(item.id);
      this.assignedSelection.deselect(item);
    } else {
      this.selectedAssignedIds.add(item.id);
      this.assignedSelection.select(item);
    }
    this.updateComputedProperties();
  }

  onUnassignedItemToggle(item: PedidoItemWithStatus): void {
    if (this.selectedUnassignedIds.has(item.id)) {
      this.selectedUnassignedIds.delete(item.id);
      this.unassignedSelection.deselect(item);
    } else {
      this.selectedUnassignedIds.add(item.id);
      this.unassignedSelection.select(item);
    }
    this.updateComputedProperties();
  }

  toggleAllAssigned(): void {
    const isAllSelected = this.assignedItemsDataSource.data.every(item => 
      this.selectedAssignedIds.has(item.id)
    );

    if (isAllSelected) {
      // Deselect all
      this.assignedItemsDataSource.data.forEach(item => {
        this.selectedAssignedIds.delete(item.id);
      });
      this.assignedSelection.clear();
    } else {
      // Select all
      this.assignedItemsDataSource.data.forEach(item => {
        this.selectedAssignedIds.add(item.id);
        this.assignedSelection.select(item);
      });
    }
    this.updateComputedProperties();
  }

  toggleAllUnassigned(): void {
    const isAllSelected = this.unassignedItemsDataSource.data.every(item => 
      this.selectedUnassignedIds.has(item.id)
    );

    if (isAllSelected) {
      // Deselect all
      this.unassignedItemsDataSource.data.forEach(item => {
        this.selectedUnassignedIds.delete(item.id);
      });
      this.unassignedSelection.clear();
    } else {
      // Select all
      this.unassignedItemsDataSource.data.forEach(item => {
        this.selectedUnassignedIds.add(item.id);
        this.unassignedSelection.select(item);
      });
    }
    this.updateComputedProperties();
  }

  // Action methods
  async onRemoveSelectedItems(): Promise<void> {
    if (this.selectedAssignedIds.size === 0) return;

    try {
      const confirmed = await this.dialogosService.confirm(
        'Remover Items',
        `¿Está seguro de remover ${this.selectedAssignedIds.size} item(s) de esta nota de recepción?`
      ).toPromise();

      if (!confirmed) return;

      this.isProcessing = true;
      
      for (const itemId of this.selectedAssignedIds) {
        // Remove item from nota by setting notaRecepcionId to null
        await this.pedidoService.onAddPedidoItemToNotaRecepcion(null, itemId).toPromise();
      }

      this.selectedAssignedIds.clear();
      this.assignedSelection.clear();
      
      // Wait for data to reload completely
      await this.loadItemsData();
      
      this.notificacionService.openSucess(`Items removidos exitosamente`);
    } catch (error) {
      console.error('Error removing items:', error);
      this.notificacionService.openWarn('Error al remover items');
    } finally {
      this.isProcessing = false;
    }
  }

  async onAddSelectedItems(): Promise<void> {
    if (this.selectedUnassignedIds.size === 0) return;

    try {
      const confirmed = await this.dialogosService.confirm(
        'Agregar Items',
        `¿Está seguro de agregar ${this.selectedUnassignedIds.size} item(s) a esta nota de recepción?`
      ).toPromise();

      if (!confirmed) return;

      this.isProcessing = true;
      
      for (const itemId of this.selectedUnassignedIds) {
        await this.pedidoService.onAddPedidoItemToNotaRecepcion(this.notaRecepcion.id, itemId).toPromise();
      }

      this.selectedUnassignedIds.clear();
      this.unassignedSelection.clear();
      
      // Wait for data to reload completely
      await this.loadItemsData();
      
      this.notificacionService.openSucess(`Items agregados exitosamente`);
    } catch (error) {
      console.error('Error adding items:', error);
      this.notificacionService.openWarn('Error al agregar items');
    } finally {
      this.isProcessing = false;
    }
  }

  async onRemoveItem(item: PedidoItemWithStatus): Promise<void> {
    try {
      const confirmed = await this.dialogosService.confirm(
        'Remover Item',
        `¿Está seguro de remover "${item.producto?.descripcion}" de esta nota?`
      ).toPromise();

      if (!confirmed) return;

      this.isProcessing = true;
      
      // Remove item from nota by setting notaRecepcionId to null
      await this.pedidoService.onAddPedidoItemToNotaRecepcion(null, item.id).toPromise();
      
      // Wait for data to reload completely before showing success and resetting processing state
      await this.loadItemsData();
      
      this.notificacionService.openSucess('Item removido exitosamente');
    } catch (error) {
      console.error('Error removing item:', error);
      this.notificacionService.openWarn('Error al remover item');
    } finally {
      this.isProcessing = false;
    }
  }

  async onAddItem(item: PedidoItemWithStatus): Promise<void> {
    this.isProcessing = true;
    try {
      await this.pedidoService.onAddPedidoItemToNotaRecepcion(this.notaRecepcion.id, item.id).toPromise();
      
      // Wait for data to reload completely
      await this.loadItemsData();
      
      this.notificacionService.openSucess('Item agregado exitosamente');
    } catch (error) {
      console.error('Error adding item:', error);
      this.notificacionService.openWarn('Error al agregar item');
    } finally {
      this.isProcessing = false;
    }
  }

  onEditItem(item: PedidoItemWithStatus): void {
    // Close dialog with edit intent
    this.dialogRef.close({ 
      editItem: item, 
      itemsChanged: false 
    } as ManageNotaItemsDialogResult);
  }

  // Pagination handlers
  onAssignedPageChange(event: any): void {
    this.loadAssignedItems(event.pageIndex, event.pageSize);
  }

  onUnassignedPageChange(event: any): void {
    this.loadUnassignedItems(event.pageIndex, event.pageSize);
  }

  // Computed properties update
  private updateComputedProperties(): void {
    // Basic info
    this.monedaSymbolComputed = this.pedido?.moneda?.simbolo || 'Gs.';
    this.dialogTitleComputed = this.readOnlyMode 
      ? `Ver Items - Nota #${this.notaRecepcion?.numero} (Solo Lectura)`
      : `Gestionar Items - Nota #${this.notaRecepcion?.numero}`;
    
    // Update computed columns based on read-only mode
    this.assignedItemsColumnsComputed = this.readOnlyMode 
      ? ['producto', 'estado', 'presentacion', 'cantidad', 'precio', 'total', 'distribution']
      : this.assignedItemsColumns;
    this.unassignedItemsColumnsComputed = this.readOnlyMode 
      ? ['producto', 'estado', 'presentacion', 'cantidad', 'precio', 'total', 'distribution']
      : this.unassignedItemsColumns;
    
    // Counts
    this.assignedCountComputed = this.assignedPage?.getTotalElements || 0;
    this.unassignedCountComputed = this.unassignedPage?.getTotalElements || 0;
    this.selectedAssignedCountComputed = this.selectedAssignedIds.size;
    this.selectedUnassignedCountComputed = this.selectedUnassignedIds.size;
    
    // Totals - use display values
    this.assignedTotalValueComputed = this.assignedItemsDataSource.data.reduce((total, item) => total + (item.displayValorTotal || 0), 0);
    this.unassignedTotalValueComputed = this.unassignedItemsDataSource.data.reduce((total, item) => total + (item.displayValorTotal || 0), 0);
    
    // Action states
    this.canRemoveItemsComputed = this.selectedAssignedIds.size > 0 && !this.isProcessing && !this.readOnlyMode;
    this.canAddItemsComputed = this.selectedUnassignedIds.size > 0 && !this.isProcessing && !this.readOnlyMode;
    this.hasDataComputed = this.assignedCountComputed > 0 || this.unassignedCountComputed > 0;
    
    // **PERFORMANCE**: Manually trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  // Utility methods
  getMonedaSymbol(): string {
    return this.monedaSymbolComputed;
  }

  isAssignedItemSelected(item: PedidoItemWithStatus): boolean {
    return this.selectedAssignedIds.has(item.id);
  }

  isUnassignedItemSelected(item: PedidoItemWithStatus): boolean {
    return this.selectedUnassignedIds.has(item.id);
  }

  isAllAssignedSelected(): boolean {
    return this.assignedItemsDataSource.data.length > 0 && 
           this.assignedItemsDataSource.data.every(item => this.selectedAssignedIds.has(item.id));
  }

  isAllUnassignedSelected(): boolean {
    return this.unassignedItemsDataSource.data.length > 0 && 
           this.unassignedItemsDataSource.data.every(item => this.selectedUnassignedIds.has(item.id));
  }

  onClose(): void {
    // Always indicate that items may have changed so parent refreshes data
    this.dialogRef.close({ itemsChanged: true });
  }
} 