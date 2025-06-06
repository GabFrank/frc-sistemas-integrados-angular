import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SelectionModel } from '@angular/cdk/collections';

import { Pedido } from '../../edit-pedido/pedido.model';
import { PedidoItem } from '../../edit-pedido/pedido-item.model';
import { NotaRecepcion } from '../../nota-recepcion/nota-recepcion.model';
import { PageInfo } from '../../../../../app.component';

import { PedidoService } from '../../pedido.service';
import { NotaRecepcionService } from '../../nota-recepcion/nota-recepcion.service';
import { MainService } from '../../../../../main.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';

import { CrearNotaRecepcionDialogComponent } from './crear-nota-recepcion-dialog/crear-nota-recepcion-dialog.component';
import { ManageNotaItemsDialogComponent } from './manage-nota-items-dialog/manage-nota-items-dialog.component';
import { dateToString, parseShortDate } from '../../../../../commons/core/utils/dateUtils';

interface PedidoItemWithStatus extends PedidoItem {
  // Add computed properties for better performance
  isAssigned: boolean;
  notaNumero?: number;
  notaTipoBoleta?: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-recepcion-nota',
  templateUrl: './recepcion-nota.component.html',
  styleUrls: ['./recepcion-nota.component.scss']
})
export class RecepcionNotaComponent implements OnInit, OnChanges {
  @ViewChild('itemsPaginator') itemsPaginator: MatPaginator;
  @ViewChild('notasPaginator') notasPaginator: MatPaginator;

  @Input() selectedPedido: Pedido;
  @Output() pedidoChange = new EventEmitter<Pedido>();

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
  totalNotas = 0;

  // Computed properties for template (to avoid function calls in HTML)
  monedaSymbol = 'Gs.';
  canCreateNotaComputed = false;
  canAssignItemsComputed = false;
  allSelectedComputed = false;
  itemsWithComputedProperties: any[] = [];

  constructor(
    private pedidoService: PedidoService,
    private notaRecepcionService: NotaRecepcionService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private dialog: MatDialog,
    private dialogosService: DialogosService
  ) {}

  ngOnInit(): void {
    this.setupFormSubscriptions();
    // Don't load data here - wait for OnChanges
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedPedido']) {
      const currentPedido = changes['selectedPedido'].currentValue;
      const previousPedido = changes['selectedPedido'].previousValue;
      
      // Only load data if pedido is available and different from previous
      if (currentPedido && currentPedido.id && currentPedido !== previousPedido) {
        this.loadInitialData();
      } else if (!currentPedido) {
        // Clear data if pedido becomes null
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
    this.totalNotas = 0;
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

  private loadInitialData(): void {
    if (this.selectedPedido?.id) {
      this.loadPedidoItems();
      this.loadNotasRecepcion();
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
          
          // Transform items with computed properties
          const itemsWithStatus: PedidoItemWithStatus[] = response.getContent.map(item => {
            // Create proper PedidoItem instance
            const pedidoItem = Object.assign(new PedidoItem(), item);
            return {
              ...pedidoItem,
              isAssigned: !!item.notaRecepcion,
              notaNumero: item.notaRecepcion?.numero,
              notaTipoBoleta: item.notaRecepcion?.tipoBoleta
            } as PedidoItemWithStatus;
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

          this.updateSummary();
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

        this.updateSummary();
        this.isLoadingNotas = false;
      },
      error: () => {
        this.isLoadingNotas = false;
        this.notificacionService.openWarn('Error al cargar notas de recepción');
      }
    });
  }

  private updateSummary(): void {
    // Update summary counters
    this.totalItems = this.pedidoItemsPage?.getTotalElements || 0;
    this.assignedItems = this.pedidoItemsDataSource.data.filter(item => item.isAssigned).length;
    this.pendingItems = this.totalItems - this.assignedItems;
    this.totalNotas = this.notasRecepcionPage?.getTotalElements || 0;
    
    // Update computed properties
    this.updateComputedProperties();
  }

  private updateComputedProperties(): void {
    // Update moneda symbol
    this.monedaSymbol = this.selectedPedido?.moneda?.simbolo || 'Gs.';
    
    // Update can create nota - use ID set for more accurate count
    this.canCreateNotaComputed = this.selectedItemIds.size > 0;
    
    // Update can assign items - use ID set for more accurate count
    this.canAssignItemsComputed = this.selectedItemIds.size > 0 && !!this.selectedNotaRecepcion;
    
    // Update all selected state - check both current page items and ID set
    const unassignedItems = this.pedidoItemsDataSource.data.filter(item => !item.isAssigned);
    const unassignedSelectedCount = unassignedItems.filter(item => this.selectedItemIds.has(item.id)).length;
    this.allSelectedComputed = unassignedItems.length > 0 && unassignedSelectedCount === unassignedItems.length;
    
    // Update items with computed properties
    this.itemsWithComputedProperties = this.pedidoItemsDataSource.data.map(item => ({
      ...item,
      statusClass: item.isAssigned ? 'item-assigned' : 'item-pending',
      statusText: item.isAssigned ? `Asignado a nota ${item.notaNumero}` : 'Pendiente de asignación'
    }));
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
      // Select all unassigned items on current page
      unassignedItems.forEach(item => this.selectedItemIds.add(item.id));
      unassignedItems.forEach(item => this.itemsSelection.select(item));
    }
    
    // Update computed properties after selection change
    this.updateComputedProperties();
  }

  toggleItemSelection(item: PedidoItemWithStatus): void {
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
        
        this.loadPedidoItems();
        this.loadNotasRecepcion();
        
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
        
        this.loadPedidoItems();
        this.loadNotasRecepcion();
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
    // Use the existing service method to assign items
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
          this.pedidoService.onAddPedidoItemToNotaRecepcion(null, item.id)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: () => {
                this.notificacionService.openSucess('Item desasignado exitosamente');
                this.loadPedidoItems();
                this.loadNotasRecepcion();
                
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
    const message = `¿Está seguro que desea eliminar la nota de recepción ${nota.numero}?\n\nTodos los items asignados a esta nota quedarán sin asignar.`;
    
    this.dialogosService.confirm('Confirmar eliminación', message)
      .subscribe(confirmed => {
        if (confirmed) {
          this.notaRecepcionService.onDeleteNotaRecepcion(nota.id)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: () => {
                this.notificacionService.openSucess('Nota de recepción eliminada exitosamente');
                this.loadPedidoItems();
                this.loadNotasRecepcion();
                
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
      if (result?.itemsChanged) {
        this.notificacionService.openSucess('Items gestionados exitosamente');
        this.loadPedidoItems();
        this.loadNotasRecepcion();
        
        // Emit pedido change to update parent component
        this.pedidoChange.emit(this.selectedPedido);
      }
    });
  }

  onSelectNota(nota: NotaRecepcion): void {
    this.selectedNotaRecepcion = this.selectedNotaRecepcion?.id === nota.id ? null : nota;
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
} 