import { Component, EventEmitter, Input, OnInit, Output, ViewChild, SimpleChanges, OnChanges } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { PedidoService } from '../../pedido.service';
import { MainService } from '../../../../../main.service';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';

import { Pedido } from '../../edit-pedido/pedido.model';
import { PedidoItem } from '../../edit-pedido/pedido-item.model';
import { PedidoEstado } from '../../edit-pedido/pedido-enums';
import { Usuario } from '../../../../personas/usuarios/usuario.model';
import { NotaRecepcion } from '../../nota-recepcion/nota-recepcion.model';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { GenericCrudService } from '../../../../../generics/generic-crud.service';
import { PedidoRecepcionMercaderiaSummaryGQL, PedidoRecepcionMercaderiaSummary } from '../../graphql/pedidoRecepcionMercaderiaSummary';
import { NotaRecepcionPorPedidoIdGQL } from '../../nota-recepcion/graphql/notaRecepcionPorPedidoId';
import { PedidoItemPorNotaRecepcionGQL } from './graphql/pedidoItemPorNotaRecepcion';

// Step tracking imports
import { PedidoStepType, StepStatus, StepInfo } from '../edit-pedido-2.component';

// Dialog imports
import { 
  VerificarPedidoItemRecepcionMercaderiaComponent, 
  VerificarPedidoItemRecepcionMercaderiaDialogData, 
  VerificarPedidoItemRecepcionMercaderiaDialogResult 
} from './verificar-pedido-item-recepcion-mercaderia/verificar-pedido-item-recepcion-mercaderia.component';
import { SucursalDistributionDialogComponent, SucursalDistributionDialogData } from './sucursal-distribution-dialog/sucursal-distribution-dialog.component';

// Recepcion Mercaderia specific types
export interface RecepcionMercaderiaSummary {
  totalItems: number;
  verifiedItems: number; // Maps to 'verificados' from backend
  pendingItems: number;  // Maps to 'pendientes' from backend
  rejectedItems: number;
  totalSucursales: number; // Maps to 'sucursales' from backend
  totalQuantityExpected: number;
  totalQuantityVerified: number;
  canComplete: boolean;
  requiresStockMovement: boolean;
  requiresPriceUpdates: boolean;
}

export interface ItemGroup {
  groupKey: string;    // NotaRecepcion ID or Producto ID
  groupName: string;   // Display name
  items: PedidoItem[];
  totalQuantity: number;
  verifiedQuantity: number;
  pendingQuantity: number;
}

export type GroupingType = 'NOTA' | 'PRODUCTO';
export type FilterStatus = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-recepcion-mercaderia',
  templateUrl: './recepcion-mercaderia.component.html',
  styleUrls: ['./recepcion-mercaderia.component.scss']
})
export class RecepcionMercaderiaComponent implements OnInit, OnChanges {

  @Input() pedido: Pedido | null = null;
  @Output() pedidoChange = new EventEmitter<Pedido>();
  @Output() stepValidChange = new EventEmitter<boolean>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  // Data sources
  dataSource = new MatTableDataSource<PedidoItem>([]);
  
  // State management
  loadingItems = false;
  loadingSummary = false;
  savingVerification = false;

  // Filter and search properties
  searchText = '';
  showVerifiedOnly = false;
  showPendingOnly = false;
  selectedSucursalFilter: Sucursal | null = null;
  
  // Nota Recepción filter
  availableNotaRecepcions: NotaRecepcion[] = [];
  selectedNotaRecepcionFilter: NotaRecepcion | null = null;

  // Pagination properties
  pageSize = 25;
  pageIndex = 0;
  totalElements = 0;

  // Real summary properties with backend data
  summaryData: RecepcionMercaderiaSummary = {
    totalItems: 0,
    verifiedItems: 0,
    pendingItems: 0,
    rejectedItems: 0,
    totalSucursales: 0,
    totalQuantityExpected: 0,
    totalQuantityVerified: 0,
    canComplete: false,
    requiresStockMovement: false,
    requiresPriceUpdates: false
  };

  // Computed properties for template binding (avoiding function calls)
  showInitButton = false;
  canInitiateStep = false;
  isStepActive = false;
  stepStatusIcon = '';
  stepStatusTitle = '';
  stepStatusSubtitle: string | null = null;
  
  // Step tracking
  currentStepInfo: StepInfo | null = null;

  // Display columns for the items table
  displayedColumns = [
    'numeroNota',
    'status',
    'producto',
    'presentacion', 
    'cantidadPedida',
    'cantidadRecepcionProducto',
    'distribucionSucursales',
    'actions'
  ];

  // Computed properties for each item to avoid function calls in template
  itemComputedProperties = new Map<string, {
    verificationStatusIcon: string;
    verificationStatusColor: string;
    verificationStatusText: string;
    hasDistributionIssues: boolean;
    groupedSucursales: { sucursales: any[], hasMore: boolean, totalCount: number };
    statusChipClass: string;
    presentacionDisplay: string;
    cantidadDisplay: string;
    notaNumeroDisplay: string;
  }>();

  // Enhanced items with computed properties for template binding
  enhancedItems: (PedidoItem & {
    computedVerificationStatusIcon: string;
    computedVerificationStatusText: string;
    computedStatusChipClass: string;
    computedPresentacionDisplay: string;
    computedCantidadDisplay: string;
    computedNotaNumeroDisplay: string;
    computedGroupedSucursales: { sucursales: any[], hasMore: boolean, totalCount: number };
    computedHasNotaNumero: boolean;
  })[] = [];

  // Computed properties for template display logic
  showTable = false;
  showNoDataMessage = false;

  constructor(
    private pedidoService: PedidoService,
    private mainService: MainService,
    private matDialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private genericCrudService: GenericCrudService,
    private pedidoRecepcionMercaderiaSummaryGQL: PedidoRecepcionMercaderiaSummaryGQL,
    private notaRecepcionPorPedidoIdGQL: NotaRecepcionPorPedidoIdGQL,
    private pedidoItemPorNotaRecepcionGQL: PedidoItemPorNotaRecepcionGQL
  ) {}

  ngOnInit(): void {
    this.updateComputedProperties();
    // Add small delay to ensure tab is fully loaded before loading data
    setTimeout(() => {
      this.loadData();
    }, 200);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only reload if pedido actually changed and has valid ID
    if (changes['pedido'] && !changes['pedido'].isFirstChange() && 
        changes['pedido'].currentValue?.id !== changes['pedido'].previousValue?.id) {
      this.updateComputedProperties();
      // Add small delay to ensure component is ready after changes
      setTimeout(() => {
        this.loadData();
      }, 100); // Reduced from 150ms
    } else if (changes['pedido'] && changes['pedido'].isFirstChange() && this.pedido?.id) {
      this.updateComputedProperties();
    }
  }

  /**
   * Load all data for the component
   */
  loadData(): void {
    if (!this.pedido?.id) {
      this.clearData();
      return;
    }

    // Load nota recepcions first, then items and summary will be loaded after nota recepcions
    this.loadNotaRecepcions();
  }

  /**
   * Clear all data when pedido is not available
   */
  private clearData(): void {
    this.availableNotaRecepcions = [];
    this.selectedNotaRecepcionFilter = null;
    this.dataSource.data = [];
    this.totalElements = 0;
    this.pageIndex = 0;
    this.summaryData = {
      totalItems: 0,
      verifiedItems: 0,
      pendingItems: 0,
      rejectedItems: 0,
      totalSucursales: 0,
      totalQuantityExpected: 0,
      totalQuantityVerified: 0,
      canComplete: false,
      requiresStockMovement: false,
      requiresPriceUpdates: false
    };
  }

  /**
   * Load nota recepcions from backend using proper API
   */
  loadNotaRecepcions(): void {
    if (!this.pedido?.id) {
      return;
    }

    this.genericCrudService.onCustomQuery(
      this.notaRecepcionPorPedidoIdGQL,
      { id: this.pedido.id },
      true // servidor parameter
    ).pipe(untilDestroyed(this))
    .subscribe({
      next: (response) => {
        // Fix data extraction - check different possible response structures
        let notaRecepcions: NotaRecepcion[] = [];
        
        if (response && Array.isArray(response)) {
          // Direct array response
          notaRecepcions = response;
        } else if (response?.data && Array.isArray(response.data)) {
          // Response with data property containing array
          notaRecepcions = response.data;
        } else if (response?.notaRecepcionPorPedidoId && Array.isArray(response.notaRecepcionPorPedidoId)) {
          // Response with specific query property
          notaRecepcions = response.notaRecepcionPorPedidoId;
        } else if (response && typeof response === 'object') {
          // Try to find array in response object
          const keys = Object.keys(response);
          for (const key of keys) {
            if (Array.isArray(response[key])) {
              notaRecepcions = response[key];   
              break;
            }
          }
        }
        
        if (notaRecepcions.length > 0) {
          this.availableNotaRecepcions = notaRecepcions;
          
          // Clear selection if current selection is no longer available
          if (this.selectedNotaRecepcionFilter && 
              !this.availableNotaRecepcions.find(nota => nota.id === this.selectedNotaRecepcionFilter?.id)) {
            this.selectedNotaRecepcionFilter = null;
          }
          
          // Set default to "Todas las notas" (null) if no selection exists
          if (!this.selectedNotaRecepcionFilter) {
            this.selectedNotaRecepcionFilter = null; // "Todas las notas"
          }
          
          // Load summary after nota recepcions are available
          this.loadSummary();
          
          // Always load items after nota recepcions are loaded
          this.loadPedidoItems();
        } else {
          this.availableNotaRecepcions = [];
          this.selectedNotaRecepcionFilter = null;
          this.dataSource.data = [];
          this.totalElements = 0;
          
          // Still load summary as it might have data from other sources
          this.loadSummary();
        }
      },
      error: (error) => {
        this.availableNotaRecepcions = [];
        this.selectedNotaRecepcionFilter = null;
        this.dataSource.data = [];
        this.totalElements = 0;
        
        // Still try to load summary
        this.loadSummary();
      }
    });
  }

  /**
   * Load pedido items using backend filtering and pagination
   */
  loadPedidoItems(): void {
    if (!this.pedido?.id) {
      this.dataSource.data = [];
      this.totalElements = 0;
      return;
    }

    // Don't load items if we don't have any nota recepcions at all
    if (this.availableNotaRecepcions.length === 0) {
      this.dataSource.data = [];
      this.totalElements = 0;
      this.updateStepValidation();
      return;
    }

    this.loadingItems = true;
    
    // Prepare parameters for backend API
    // If no nota recepcion is selected, pass null to get all items (for "Todas las notas")
    const notaRecepcionId = this.selectedNotaRecepcionFilter?.id || null;
    const searchText = this.searchText?.trim() || null;
    const verificado = this.getVerificadoFilter();

    // Use backend API with proper filtering
    this.genericCrudService.onCustomQuery(
      this.pedidoItemPorNotaRecepcionGQL,
      {
        id: notaRecepcionId,
        page: this.pageIndex,
        size: this.pageSize,
        texto: searchText,
        verificado: verificado,
        pedidoId: notaRecepcionId ? null : this.pedido?.id // Pass pedidoId when no nota recepcion selected
      },
      true // servidor parameter
    ).pipe(untilDestroyed(this))
    .subscribe({
      next: (response) => {
        // Based on GraphQL query structure: response.data contains the pagination object
        let pageData = null;
        
        if (response && typeof response === 'object') {
          // The GraphQL query returns { data: { getTotalPages, getTotalElements, getContent: [...] } }
          if (response.data && typeof response.data === 'object') {
            pageData = response.data;
          }
          // Check for direct response structure (fallback)
          else if (response.getContent !== undefined || response.getTotalElements !== undefined) {
            pageData = response;
          }
          // Check for Apollo Cache response structure
          else if (response.pedidoItemPorNotaRecepcion) {
            pageData = response.pedidoItemPorNotaRecepcion;
          }
        }
        
        if (pageData) {
          // Extract items and pagination info
          const items = pageData.getContent || pageData.content || [];
          const totalElements = pageData.getTotalElements || pageData.totalElements || 0;
          
          this.dataSource.data = Array.isArray(items) ? items : [];
          this.totalElements = totalElements;
          
          // Compute properties for all items to avoid function calls in template
          this.computeItemProperties();
        } else {
          this.dataSource.data = [];
          this.totalElements = 0;
        }
        
        this.loadingItems = false;
        this.updateStepValidation();
        this.updateComputedProperties(); // Update display logic after loading
      },
      error: (error) => {
        console.error('Error loading items:', error);
        this.dataSource.data = [];
        this.totalElements = 0;
        this.loadingItems = false;
        this.updateStepValidation();
        this.updateComputedProperties(); // Update display logic after error
      }
    });
  }

  /**
   * Get verificado filter value for backend API
   */
  private getVerificadoFilter(): boolean | null {
    if (this.showVerifiedOnly) return true;
    if (this.showPendingOnly) return false;
    return null; // Show all
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    console.log('📦 RecepcionMercaderia: Page change:', event);
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadPedidoItems();
  }

  /**
   * Load summary data from backend
   */
  loadSummary(): void {
    if (!this.pedido?.id) {
      return;
    }

    this.loadingSummary = true;

    // Use new backend summary API
    this.genericCrudService.onCustomQuery(
      this.pedidoRecepcionMercaderiaSummaryGQL, 
      { id: this.pedido.id },
      true // servidor parameter
    ).pipe(untilDestroyed(this))
    .subscribe({
      next: (summaryResponse) => {
        // Try different response structure patterns
        let summaryData = null;
        
        if (summaryResponse && typeof summaryResponse === 'object') {
          // Check for data property
          if (summaryResponse.data && typeof summaryResponse.data === 'object') {
            summaryData = summaryResponse.data;
          }
          // Check for specific query property
          else if (summaryResponse.pedidoRecepcionMercaderiaSummary) {
            summaryData = summaryResponse.pedidoRecepcionMercaderiaSummary;
          }
          // Check if response itself is the summary
          else if (summaryResponse.totalItems !== undefined) {
            summaryData = summaryResponse;
          }
        }
        
        if (summaryData && summaryData.totalItems !== undefined) {
          this.summaryData = this.mapBackendSummaryToComponent(summaryData);
        } else {
          this.calculateSummaryFromItems(); // Fallback calculation
        }
        
        this.loadingSummary = false;
        this.updateStepValidation();
      },
      error: (error) => {
        console.error('Error loading summary from backend:', error);
        // Fallback to calculation from local data
        this.calculateSummaryFromItems();
        this.loadingSummary = false;
        this.updateStepValidation();
      }
    });
  }

  /**
   * Map backend summary to component interface
   */
  private mapBackendSummaryToComponent(backendSummary: PedidoRecepcionMercaderiaSummary): RecepcionMercaderiaSummary {
    return {
      totalItems: backendSummary.totalItems || 0,
      verifiedItems: backendSummary.verificados || 0, // Backend 'verificados' maps to 'verifiedItems'
      pendingItems: backendSummary.pendientes || 0,   // Backend 'pendientes' maps to 'pendingItems'
      rejectedItems: 0, // Not provided by backend, calculate if needed
      totalSucursales: backendSummary.sucursales || 0, // Backend 'sucursales' maps to 'totalSucursales'
      totalQuantityExpected: 0, // Additional calculation if needed
      totalQuantityVerified: 0,  // Additional calculation if needed
      canComplete: (backendSummary.pendientes || 0) === 0 && (backendSummary.totalItems || 0) > 0,
      requiresStockMovement: false, // Business logic calculation
      requiresPriceUpdates: false   // Business logic calculation
    };
  }

  /**
   * Calculate summary from items (fallback when backend fails)
   */
  private calculateSummaryFromItems(): void {
    const currentItems = this.dataSource.data;
    
    const summary: RecepcionMercaderiaSummary = {
      totalItems: currentItems.length,
      verifiedItems: 0,
      pendingItems: 0,
      rejectedItems: 0,
      totalSucursales: 0,
      totalQuantityExpected: 0,
      totalQuantityVerified: 0,
      canComplete: false,
      requiresStockMovement: false,
      requiresPriceUpdates: false
    };

    // Calculate summary from current items
    currentItems.forEach(item => {
      if (item.verificadoRecepcionProducto) {
        summary.verifiedItems++;
        summary.totalQuantityVerified += item.cantidadRecepcionProducto || 0;
      } else {
        summary.pendingItems++;
      }
      
      summary.totalQuantityExpected += item.cantidadCreacion || 0;
      
      // Count unique sucursales
      if (item.pedidoItemSucursalList?.length) {
        const sucursalIds = new Set(item.pedidoItemSucursalList.map(s => s.sucursalEntrega?.id).filter(id => id));
        summary.totalSucursales = Math.max(summary.totalSucursales, sucursalIds.size);
      }
    });

    summary.canComplete = summary.pendingItems === 0 && summary.totalItems > 0;
    summary.requiresStockMovement = summary.verifiedItems > 0;
    summary.requiresPriceUpdates = summary.verifiedItems !== summary.totalItems;

    this.summaryData = summary;
  }

  /**
   * Update step validation based on current state
   */
  updateStepValidation(): void {
    const isValid = this.summaryData.totalItems > 0 && this.summaryData.pendingItems === 0;
    this.stepValidChange.emit(isValid);
    this.updateComputedProperties();
  }

  /**
   * Update computed properties for template binding
   */
  updateComputedProperties(): void {
    if (!this.pedido) {
      this.clearComputedProperties();
      return;
    }

    // Calculate display logic for table and no data message
    this.showTable = this.dataSource.data.length > 0;
    this.showNoDataMessage = !this.loadingItems && this.dataSource.data.length === 0 && this.availableNotaRecepcions.length > 0;

    // Get current step info based on pedido estado
    this.currentStepInfo = this.getCurrentStepInfo();
    
    if (this.currentStepInfo) {
      this.showInitButton = this.currentStepInfo.status === StepStatus.AVAILABLE && this.currentStepInfo.canStart;
      this.canInitiateStep = this.currentStepInfo.canStart && this.currentStepInfo.status === StepStatus.AVAILABLE;
      this.isStepActive = this.currentStepInfo.status === StepStatus.IN_PROGRESS || this.currentStepInfo.status === StepStatus.COMPLETED;
      
      // Status icon
      switch (this.currentStepInfo.status) {
        case StepStatus.NOT_STARTED:
          this.stepStatusIcon = 'radio_button_unchecked';
          break;
        case StepStatus.AVAILABLE:
          this.stepStatusIcon = 'play_circle_outline';
          break;
        case StepStatus.IN_PROGRESS:
          this.stepStatusIcon = 'pending';
          break;
        case StepStatus.COMPLETED:
          this.stepStatusIcon = 'check_circle';
          break;
        default:
          this.stepStatusIcon = 'radio_button_unchecked';
          break;
      }
      
      // Status title
      switch (this.currentStepInfo.status) {
        case StepStatus.NOT_STARTED:
          this.stepStatusTitle = 'Etapa no iniciada';
          break;
        case StepStatus.AVAILABLE:
          this.stepStatusTitle = 'Lista para iniciar';
          break;
        case StepStatus.IN_PROGRESS:
          this.stepStatusTitle = `En progreso (${this.currentStepInfo.progress || 0}%)`;
          break;
        case StepStatus.COMPLETED:
          this.stepStatusTitle = 'Etapa completada';
          break;
        default:
          this.stepStatusTitle = 'Estado desconocido';
          break;
      }
      
      // Status subtitle
      if (this.currentStepInfo.assignedUser && this.currentStepInfo.startDate) {
        const userName = this.currentStepInfo.assignedUser.persona?.nombre || 'Usuario';
        const startDate = new Date(this.currentStepInfo.startDate).toLocaleString();
        this.stepStatusSubtitle = `Iniciado por ${userName} el ${startDate}`;
      } else if (this.currentStepInfo.status === StepStatus.AVAILABLE) {
        this.stepStatusSubtitle = 'Haga clic en "Iniciar" para comenzar esta etapa';
      } else {
        this.stepStatusSubtitle = null;
      }
    } else {
      this.clearComputedProperties();
    }
  }

  /**
   * Clear computed properties
   */
  private clearComputedProperties(): void {
    this.currentStepInfo = null;
    this.showInitButton = false;
    this.canInitiateStep = false;
    this.isStepActive = false;
    this.stepStatusIcon = '';
    this.stepStatusTitle = '';
    this.stepStatusSubtitle = null;
  }

  /**
   * Get current step info based on pedido estado
   */
  private getCurrentStepInfo(): StepInfo | null {
    if (!this.pedido) {
      return null;
    }

    // Create step info based on pedido fields
    const stepInfo: StepInfo = {
      stepType: PedidoStepType.RECEPCION_MERCADERIA,
      status: this.getStepStatus(),
      assignedUser: this.pedido.usuarioRecepcionMercaderia || null,
      startDate: this.pedido.fechaInicioRecepcionMercaderia || null,
      endDate: this.pedido.fechaFinRecepcionMercaderia || null,
      progress: this.pedido.progresoRecepcionMercaderia || 0,
      canStart: this.canStartStep(),
      canComplete: this.canCompleteStep()
    };

    return stepInfo;
  }

  /**
   * Get step status based on pedido data
   */
  private getStepStatus(): StepStatus {
    if (!this.pedido) {
      return StepStatus.NOT_STARTED;
    }

    if (this.pedido.fechaFinRecepcionMercaderia) {
      return StepStatus.COMPLETED;
    }
    
    if (this.pedido.fechaInicioRecepcionMercaderia) {
      return StepStatus.IN_PROGRESS;
    }

    // Check if step is available based on pedido estado
    if (this.pedido.estado === PedidoEstado.EN_RECEPCION_MERCADERIA) {
      return StepStatus.AVAILABLE;
    }

    return StepStatus.NOT_STARTED;
  }

  /**
   * Check if step can be started
   */
  private canStartStep(): boolean {
    return this.pedido?.estado === PedidoEstado.EN_RECEPCION_MERCADERIA;
  }

  /**
   * Check if step can be completed
   */
  private canCompleteStep(): boolean {
    return this.pedido?.fechaInicioRecepcionMercaderia != null &&
           this.dataSource.data.length > 0 &&
           this.dataSource.data.every(item => item.verificadoRecepcionProducto === true);
  }

  /**
   * Begin the Recepcion Mercaderia step
   */
  beginRecepcionMercaderiaStep(): void {
    if (!this.pedido || !this.canInitiateStep) {
      return;
    }

    const updatedPedido = new Pedido();
    Object.assign(updatedPedido, this.pedido);
    
    // Set step initiation fields
    updatedPedido.fechaInicioRecepcionMercaderia = new Date();
    updatedPedido.progresoRecepcionMercaderia = 0;

    // Save the updated pedido
    this.savePedidoStepInfo(updatedPedido, 'Iniciando recepción de mercadería');
  }

  /**
   * Save pedido step information
   */
  private savePedidoStepInfo(updatedPedido: Pedido, successMessage: string): void {
    this.pedidoService.onSave(updatedPedido.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (savedPedido) => {
          this.pedido = savedPedido;
          this.updateComputedProperties();
          this.pedidoChange.emit(savedPedido);
          
          if (successMessage) {
            this.notificacionService.openSucess(successMessage);
          }
          
          // Reload items after step initiation
          setTimeout(() => {
            this.loadData();
          }, 500);
        },
        error: (error) => {
          console.error('Error saving step information:', error);
          this.notificacionService.openWarn("Error al guardar información de etapa");
        }
      });
  }

  // Filter and search methods
  onSearchChange(): void {
    // Remove automatic search - only search on Enter or icon click
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.performSearch();
    }
  }

  onSearchIconClick(): void {
    this.performSearch();
  }

  private performSearch(): void {
    // Only search if we have nota recepcions available
    if (this.availableNotaRecepcions.length > 0) {
      // Reset pagination and reload items with new search
      this.pageIndex = 0;
      this.loadPedidoItems();
    }
  }

  onVerificationFilterChange(): void {
    if (this.showVerifiedOnly) {
      this.showPendingOnly = false;
    } else if (this.showPendingOnly) {
      this.showVerifiedOnly = false;
    }
    
    // Only filter if we have nota recepcions available
    if (this.availableNotaRecepcions.length > 0) {
      // Reset pagination and reload items with new filter
      this.pageIndex = 0;
      this.loadPedidoItems();
    }
  }

  onFilterChange(filterValue: string): void {
    this.showVerifiedOnly = filterValue === 'VERIFIED';
    this.showPendingOnly = filterValue === 'PENDING';
    
    // Only filter if we have nota recepcions available
    if (this.availableNotaRecepcions.length > 0) {
      // Reset pagination and reload items with new filter
      this.pageIndex = 0;
      this.loadPedidoItems();
    }
  }

  onSucursalFilterChange(): void {
    // Note: Sucursal filter might be implemented differently in backend
    // For now, we don't implement it as it's not in the current API
  }

  onNotaRecepcionFilterChange(): void {
    // Reset pagination and reload items when nota recepcion changes
    this.pageIndex = 0;
    this.loadPedidoItems();
  }

  clearFilters(): void {
    this.searchText = '';
    this.showVerifiedOnly = false;
    this.showPendingOnly = false;
    this.selectedSucursalFilter = null;
    this.selectedNotaRecepcionFilter = null; // Set to "Todas las notas"
    this.pageIndex = 0;
    
    // Reload with cleared filters - "Todas las notas" will load all items
    if (this.availableNotaRecepcions.length > 0) {
      this.loadPedidoItems();
    }
  }

  // Item verification methods
  verifyItem(item: PedidoItem): void {
    // Prevent opening dialog if already saving
    if (this.savingVerification) {
      return;
    }
    
    this.openVerificationDialog(item, false);
  }

  editVerification(item: PedidoItem): void {
    // Prevent opening dialog if already saving
    if (this.savingVerification) {
      return;
    }
    
    this.openVerificationDialog(item, true);
  }

  /**
   * Open verification dialog for an item
   */
  private openVerificationDialog(item: PedidoItem, isEditing: boolean): void {
    const dialogData: VerificarPedidoItemRecepcionMercaderiaDialogData = {
      pedidoItem: item,
      isEditing: isEditing
    };

    const dialogRef = this.matDialog.open(VerificarPedidoItemRecepcionMercaderiaComponent, {
      data: dialogData,
      width: '90%',
      maxWidth: '1000px',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: false,
      panelClass: ['modern-dialog', 'verification-dialog']
    });

    dialogRef.afterClosed().subscribe((result: VerificarPedidoItemRecepcionMercaderiaDialogResult) => {
      if (result?.confirmed && result.needsUIRefresh) {
        // Update the item in our local arrays
        if (result.updatedItem) {
          this.updateLocalItem(result.updatedItem);
        }
        
        // Only refresh summary data (no need for full reload)
        setTimeout(() => {
          this.loadSummary();
        }, 500); // Delay to ensure backend is updated
      }
    });
  }

  /**
   * Update item in local arrays without full reload
   */
  private updateLocalItem(updatedItem: PedidoItem): void {
    // Update the item in the current page data
    const tableData = this.dataSource.data;
    const tableIndex = tableData.findIndex(item => item.id === updatedItem.id);
    if (tableIndex !== -1) {
      tableData[tableIndex] = updatedItem;
      this.dataSource.data = [...tableData]; // Trigger change detection
      
      // Recompute properties for updated data
      this.computeItemProperties();
    }

    // Update step validation based on new data
    this.updateStepValidation();
  }

  viewDistribution(item: PedidoItem): void {
    const dialogData: SucursalDistributionDialogData = {
      pedidoItem: item
    };

    this.matDialog.open(SucursalDistributionDialogComponent, {
      data: dialogData,
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      disableClose: false,
      autoFocus: false,
      panelClass: ['modern-dialog', 'sucursal-distribution-dialog']
    });
  }

  /**
   * Get verification status icon for an item
   */
  getVerificationStatusIcon(item: PedidoItem): string {
    return item.verificadoRecepcionProducto ? 'check_circle' : 'pending';
  }

  /**
   * Get verification status color for an item
   */
  getVerificationStatusColor(item: PedidoItem): string {
    return item.verificadoRecepcionProducto ? 'accent' : 'warn';
  }

  /**
   * Get verification status text for an item
   */
  getVerificationStatusText(item: PedidoItem): string {
    return item.verificadoRecepcionProducto ? 'Verificado' : 'Pendiente';
  }

  /**
   * Check if item has distribution issues
   */
  hasDistributionIssues(item: PedidoItem): boolean {
    if (!item.pedidoItemSucursalList?.length) {
      return true;
    }
    
    const totalDistributed = item.pedidoItemSucursalList.reduce((sum, dist) => 
      sum + (dist.cantidadPorUnidad || 0), 0);
    
    return totalDistributed !== (item.cantidadRecepcionProducto || item.cantidadCreacion || 0);
  }

  /**
   * Get grouped sucursales for display in table
   * Returns first few sucursales, and count if there are more
   */
  getGroupedSucursales(item: PedidoItem): { sucursales: any[], hasMore: boolean, totalCount: number } {
    if (!item.pedidoItemSucursalList?.length) {
      return { sucursales: [], hasMore: false, totalCount: 0 };
    }

    // Group by sucursal and sum quantities
    const sucursalMap = new Map<number, { sucursal: any, totalCantidad: number }>();
    
    item.pedidoItemSucursalList.forEach(dist => {
      if (dist.sucursalEntrega?.id) {
        const sucursalId = dist.sucursalEntrega.id;
        
        if (!sucursalMap.has(sucursalId)) {
          sucursalMap.set(sucursalId, {
            sucursal: dist.sucursalEntrega,
            totalCantidad: 0
          });
        }
        
        sucursalMap.get(sucursalId)!.totalCantidad += dist.cantidadPorUnidad || 0;
      }
    });
    
    const allSucursales = Array.from(sucursalMap.values());
    const maxDisplay = 2; // Show first 2 sucursales
    
    return {
      sucursales: allSucursales.slice(0, maxDisplay),
      hasMore: allSucursales.length > maxDisplay,
      totalCount: allSucursales.length
    };
  }

  /**
   * Compute properties for all items to avoid function calls in template
   */
  private computeItemProperties(): void {
    this.itemComputedProperties.clear();
    
    // Create enhanced items with computed properties
    this.enhancedItems = this.dataSource.data.map(item => {
      const enhancedItem = item as any;
      
      // Add computed properties to the item
      enhancedItem.computedVerificationStatusIcon = this.getVerificationStatusIcon(item);
      enhancedItem.computedVerificationStatusText = this.getVerificationStatusText(item);
      enhancedItem.computedStatusChipClass = 'status-chip ' + (item.verificadoRecepcionProducto ? 'verified' : 'pending');
      enhancedItem.computedPresentacionDisplay = this.computePresentacionDisplay(item);
      enhancedItem.computedCantidadDisplay = this.computeCantidadDisplay(item);
      enhancedItem.computedNotaNumeroDisplay = this.computeNotaNumeroDisplay(item);
      enhancedItem.computedGroupedSucursales = this.getGroupedSucursales(item);
      enhancedItem.computedHasNotaNumero = !!item.notaRecepcion?.numero;
      
      // Still keep the Map for backward compatibility if needed
      const computedProps = {
        verificationStatusIcon: enhancedItem.computedVerificationStatusIcon,
        verificationStatusColor: this.getVerificationStatusColor(item),
        verificationStatusText: enhancedItem.computedVerificationStatusText,
        hasDistributionIssues: this.hasDistributionIssues(item),
        groupedSucursales: enhancedItem.computedGroupedSucursales,
        statusChipClass: enhancedItem.computedStatusChipClass,
        presentacionDisplay: enhancedItem.computedPresentacionDisplay,
        cantidadDisplay: enhancedItem.computedCantidadDisplay,
        notaNumeroDisplay: enhancedItem.computedNotaNumeroDisplay
      };
      
      this.itemComputedProperties.set(item.id.toString(), computedProps);
      
      return enhancedItem;
    });
    
    // Update the dataSource to use enhanced items
    this.dataSource.data = this.enhancedItems;
  }

  /**
   * Helper methods for computing display values
   */
  private computePresentacionDisplay(item: PedidoItem): string {
    if (item.presentacionRecepcionNota?.descripcion) {
      return `(${item.presentacionRecepcionNota.descripcion}) ${item.presentacionRecepcionNota.cantidad || ''}`;
    }
    return item.presentacionRecepcionNota?.cantidad?.toString() || '';
  }

  private computeCantidadDisplay(item: PedidoItem): string {
    return (item.cantidadRecepcionNota || item.cantidadCreacion || 0).toString();
  }

  private computeNotaNumeroDisplay(item: PedidoItem) {
    // if numero qualifies as number, then add thousands separator and return as string
    // if not (maybe has a letter or slash) return the original string
    if (item.notaRecepcion?.numero) {
      if (!isNaN(Number(item.notaRecepcion.numero))) {
        return item.notaRecepcion.numero.toLocaleString('es-AR');
      }
      return item.notaRecepcion.numero;
    }
    return 'Sin nota';
  }
} 