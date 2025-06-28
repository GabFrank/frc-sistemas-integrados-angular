import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, Subject } from 'rxjs';

import { PedidoService } from '../../pedido.service';
import { MainService } from '../../../../../main.service';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { GenericCrudService } from '../../../../../generics/generic-crud.service';

import { Pedido } from '../../edit-pedido/pedido.model';
import { Usuario } from '../../../../personas/usuarios/usuario.model';
import { NotaRecepcion } from '../../nota-recepcion/nota-recepcion.model';
import { NotaRecepcionAgrupada, NotaRecepcionAgrupadaEstado } from '../../nota-recepcion/nota-recepcion-agrupada/nota-recepcion-agrupada.model';
import { SolicitudPago, SolicitudPagoEstado } from '../../../solicitud-pago/solicitud-pago.model';
import { PagoEstado } from '../../../pago/pago.model';
import { PedidoEstado } from '../../edit-pedido/pedido-enums';

// GraphQL imports
import { GetSolicitudPagoSummaryGQL } from './graphql/getSolicitudPagoSummary';
import { GetNotasSinAgruparGQL } from './graphql/getNotasSinAgrupar';
import { GetGruposDisponiblesParaSolicitudPagoGQL } from './graphql/getGruposDisponiblesParaSolicitudPago';
import { GetGruposPorPedidoGQL } from './graphql/getGruposPorPedido';
import { CrearGrupoYAsignarGQL } from './graphql/crearGrupoYAsignar';
import { AsignarNotasAGrupoGQL } from './graphql/asignarNotasAGrupo';
import { FinalizarSolicitudPagoStepGQL } from './graphql/finalizarSolicitudPagoStep';
import { EliminarNotaRecepcionAgrupadaGQL } from './graphql/eliminarNotaRecepcionAgrupada';
// import { GetGruposCreadosGQL } from './graphql/getGruposCreados'; // COMMENTED OUT - having GraphQL issues
// import { NotaRecepcionAgrupadaService } from '../../nota-recepcion/nota-recepcion-agrupada/nota-recepcion-agrupada.service'; // Not needed - using getGruposDisponiblesGQL instead

// Dialog imports
import { ConfirmarFinalizacionDialogComponent, ConfirmarFinalizacionDialogData, ConfirmarFinalizacionDialogResult } from './dialogs/confirmar-finalizacion-dialog/confirmar-finalizacion-dialog.component';
import { CrearGrupoDialogComponent, CrearGrupoDialogData, CrearGrupoDialogResult } from './dialogs/crear-grupo-dialog/crear-grupo-dialog.component';
import { SeleccionarGrupoExistenteDialogComponent, SeleccionarGrupoExistenteDialogData, SeleccionarGrupoExistenteDialogResult } from './dialogs/seleccionar-grupo-existente-dialog/seleccionar-grupo-existente-dialog.component';
import { GestionarGrupoDialogComponent, GestionarGrupoDialogData, GestionarGrupoDialogResult } from './dialogs/gestionar-grupo-dialog/gestionar-grupo-dialog.component';

// Solicitud Pago specific types
export interface SolicitudPagoSummaryData {
  totalNotas: number;
  notasAgrupadas: number;
  notasSinAgrupar: number;
  totalGrupos: number;
  valorTotalNotas: number;
  valorTotalAgrupado: number;
  puedeProgresar: boolean;
}

export interface NotaRecepcionAgrupadaInfo {
  grupo: NotaRecepcionAgrupada;
  notasAsignadas: NotaRecepcion[];
  valorTotal: number;
  puedeAgregarNotas: boolean;
  puedeEliminar: boolean;
  puedeVerSolicitudPago: boolean;
  esGrupoExterno: boolean;
}

// Dialog interfaces - Now imported from individual dialog components

// Data loading coordination types
type DataSource = 'notas' | 'grupos' | 'summary';
type OperationType = 'create_group' | 'assign_notes' | 'delete_group' | 'finalize' | 'initialization' | 'step_change';

export interface DataLoadingState {
  notas: boolean;
  grupos: boolean;
  summary: boolean;
}

export interface LoadingCoordinator {
  pendingRequests: Set<DataSource>;
  lastLoadedPedidoId: number | null;
  dataChangeFlags: {
    notasChanged: boolean;
    gruposChanged: boolean;
    summaryChanged: boolean;
  };
}

// Add pagination interface
export interface GruposPaginationInfo {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isFirst: boolean;
  isLast: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-solicitud-pago',
  templateUrl: './solicitud-pago.component.html',
  styleUrls: ['./solicitud-pago.component.scss']
})
export class SolicitudPagoComponent implements OnInit, OnChanges, OnDestroy {

  @Input() pedido: Pedido | null = null;
  @Input() isStepActive = false; // Controlled by parent component
  @Output() pedidoChange = new EventEmitter<Pedido>();
  @Output() stepValidChange = new EventEmitter<boolean>();

  // Enhanced state management with coordination
  private loadingCoordinator: LoadingCoordinator = {
    pendingRequests: new Set<DataSource>(),
    lastLoadedPedidoId: null,
    dataChangeFlags: {
      notasChanged: false,
      gruposChanged: false,
      summaryChanged: false
    }
  };

  // Debounced computed properties update
  private computedPropertiesUpdateSubject = new Subject<void>();

  // State management
  loadingNotas = false;
  loadingGrupos = false;
  loadingGruposPagination = false; // NEW: Specific loading for pagination changes
  loadingSummary = false;
  processingGrouping = false;

  // Consolidated loading state
  isAnyDataLoading = false;

  // Data arrays
  notasSinAgrupar: NotaRecepcion[] = [];
  gruposCreados: NotaRecepcionAgrupadaInfo[] = [];
  gruposDisponibles: NotaRecepcionAgrupada[] = [];

  // Pagination state for grupos
  gruposPagination: GruposPaginationInfo = {
    currentPage: 0,
    pageSize: 10, // Default page size
    totalPages: 0,
    totalElements: 0,
    hasNext: false,
    hasPrevious: false,
    isFirst: true,
    isLast: true
  };

  // Summary data
  summaryData: SolicitudPagoSummaryData = {
    totalNotas: 0,
    notasAgrupadas: 0,
    notasSinAgrupar: 0,
    totalGrupos: 0,
    valorTotalNotas: 0,
    valorTotalAgrupado: 0,
    puedeProgresar: false
  };

  // Computed properties for template binding (avoiding function calls)
  canProceedToNextStep = false;
  showSelectionActions = false;
  showLeftPanel = false;
  showRightPanel = false;
  showNoDataMessage = false;
  nextButtonTooltip = '';

  // Selection management
  notasSeleccionadas = new Set<number>();

  // Enhanced notas with computed properties for template binding
  enhancedNotasSinAgrupar: any[] = [];

  // Enhanced grupos with computed properties for template binding
  enhancedGruposCreados: any[] = [];

  constructor(
    private pedidoService: PedidoService,
    private mainService: MainService,
    private matDialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private genericCrudService: GenericCrudService,
    private getSolicitudPagoSummaryGQL: GetSolicitudPagoSummaryGQL,
    private getNotasSinAgruparGQL: GetNotasSinAgruparGQL,
    private getGruposDisponiblesParaSolicitudPagoGQL: GetGruposDisponiblesParaSolicitudPagoGQL,
    private getGruposPorPedidoGQL: GetGruposPorPedidoGQL,
    private crearGrupoYAsignarGQL: CrearGrupoYAsignarGQL,
    private asignarNotasAGrupoGQL: AsignarNotasAGrupoGQL,
    private finalizarSolicitudPagoStepGQL: FinalizarSolicitudPagoStepGQL,
    private eliminarNotaRecepcionAgrupadaGQL: EliminarNotaRecepcionAgrupadaGQL
    // private getGruposCreadosGQL: GetGruposCreadosGQL // COMMENTED OUT - having GraphQL issues
    // private notaRecepcionAgrupadaService: NotaRecepcionAgrupadaService // Not needed - using new specific GQL instead
  ) {
    // Setup debounced computed properties update
    this.computedPropertiesUpdateSubject
      .pipe(
        debounceTime(50), // Small delay to batch multiple updates
        untilDestroyed(this)
      )
      .subscribe(() => {
        this.executeComputedPropertiesUpdate();
      });
  }

  ngOnInit(): void {
    this.triggerComputedPropertiesUpdate();
    if (this.isStepActive) {
    setTimeout(() => {
        this.loadDataIntelligently('initialization');
    }, 200);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pedido'] && !changes['pedido'].isFirstChange() && 
        changes['pedido'].currentValue?.id !== changes['pedido'].previousValue?.id) {
      this.resetLoadingCoordinator();
      this.triggerComputedPropertiesUpdate();
      if (this.isStepActive) {
        setTimeout(() => {
          this.loadDataIntelligently('step_change');
        }, 100);
      }
    } else if (changes['pedido'] && changes['pedido'].isFirstChange() && this.pedido?.id) {
      this.triggerComputedPropertiesUpdate();
    }

    // Handle step activation changes
    if (changes['isStepActive'] && changes['isStepActive'].currentValue && !changes['isStepActive'].previousValue) {
      // Step just became active - load data intelligently
      setTimeout(() => {
        this.loadDataIntelligently('step_change');
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.notasSeleccionadas.clear();
    this.notasSinAgrupar = [];
    this.gruposCreados = [];
    this.gruposDisponibles = [];
    this.enhancedNotasSinAgrupar = [];
    this.enhancedGruposCreados = [];
  }

  // Intelligent data loading with coordination
  private loadDataIntelligently(operationType: OperationType): void {
    if (!this.pedido?.id) {
      this.clearData();
      return;
    }

    // Check if we need to load data at all
    const pedidoChanged = this.loadingCoordinator.lastLoadedPedidoId !== this.pedido.id;
    
    if (!pedidoChanged && !this.shouldReloadForOperation(operationType)) {
      return;
    }

    this.loadingCoordinator.lastLoadedPedidoId = this.pedido.id;

    // Determine which data sources need refresh
    const dataSourcesToLoad = this.getDataSourcesToLoad(operationType, pedidoChanged);
    
    if (dataSourcesToLoad.length === 0) {
      return;
    }

    // Load only necessary data sources
    dataSourcesToLoad.forEach(source => {
      if (!this.loadingCoordinator.pendingRequests.has(source)) {
        this.loadDataSource(source);
      }
    });
  }

  private shouldReloadForOperation(operationType: OperationType): boolean {
    switch (operationType) {
      case 'initialization':
      case 'step_change':
        return true; // Always load on initialization/step change
      case 'create_group':
        return this.loadingCoordinator.dataChangeFlags.notasChanged || 
               this.loadingCoordinator.dataChangeFlags.gruposChanged ||
               this.loadingCoordinator.dataChangeFlags.summaryChanged;
      case 'assign_notes':
        return this.loadingCoordinator.dataChangeFlags.notasChanged || 
               this.loadingCoordinator.dataChangeFlags.gruposChanged ||
               this.loadingCoordinator.dataChangeFlags.summaryChanged;
      case 'delete_group':
        return this.loadingCoordinator.dataChangeFlags.notasChanged || 
               this.loadingCoordinator.dataChangeFlags.gruposChanged ||
               this.loadingCoordinator.dataChangeFlags.summaryChanged;
      case 'finalize':
        return false; // Finalization doesn't require data reload
      default:
        return false;
    }
  }

  private getDataSourcesToLoad(operationType: OperationType, pedidoChanged: boolean): DataSource[] {
    if (pedidoChanged) {
      return ['notas', 'grupos', 'summary']; // Load all on pedido change
    }

    switch (operationType) {
      case 'initialization':
      case 'step_change':
        return ['notas', 'grupos', 'summary'];
      case 'create_group':
        return ['notas', 'grupos', 'summary']; // Group creation affects all
      case 'assign_notes':
        return ['notas', 'grupos', 'summary']; // Note assignment affects all
      case 'delete_group':
        return ['notas', 'grupos', 'summary']; // Group deletion affects all
      case 'finalize':
        return []; // No reload needed for finalization
      default:
        return [];
    }
  }

  private loadDataSource(source: DataSource): void {
    if (this.loadingCoordinator.pendingRequests.has(source)) {
      return; // Already loading this source
    }

    this.loadingCoordinator.pendingRequests.add(source);
    this.updateConsolidatedLoadingState();

    switch (source) {
      case 'notas':
        this.loadNotasSinAgruparOptimized();
        break;
      case 'grupos':
        this.loadGruposCreadosOptimized();
        break;
      case 'summary':
        this.loadSummaryOptimized();
        break;
    }
  }

  private updateConsolidatedLoadingState(): void {
    this.isAnyDataLoading = this.loadingCoordinator.pendingRequests.size > 0;
  }

  private onDataSourceLoaded(source: DataSource): void {
    this.loadingCoordinator.pendingRequests.delete(source);
    this.updateConsolidatedLoadingState();
    
    // Trigger computed properties update if all loading is complete
    if (this.loadingCoordinator.pendingRequests.size === 0) {
      this.triggerComputedPropertiesUpdate();
    }
  }

  private clearData(): void {
    this.notasSinAgrupar = [];
    this.gruposCreados = [];
    this.gruposDisponibles = [];
    this.enhancedNotasSinAgrupar = [];
    this.enhancedGruposCreados = [];
    this.notasSeleccionadas.clear();
    this.resetLoadingCoordinator();
    this.triggerComputedPropertiesUpdate();
  }

  private resetLoadingCoordinator(): void {
    this.loadingCoordinator.pendingRequests.clear();
    this.loadingCoordinator.lastLoadedPedidoId = null;
    this.loadingCoordinator.dataChangeFlags = {
      notasChanged: false,
      gruposChanged: false,
      summaryChanged: false
    };
    // Reset pagination when loading coordinator is reset
    this.resetGruposPagination();
  }

  // Optimized data loading methods
  private loadNotasSinAgruparOptimized(): void {
    if (!this.pedido?.id) {
      return;
    }

    this.loadingNotas = true;
    
    this.genericCrudService.onCustomQuery(
      this.getNotasSinAgruparGQL,
      { pedidoId: this.pedido.id }
    ).pipe(untilDestroyed(this)).subscribe({
      next: (data) => {
        // Check different possible response structures
        let notasArray = [];
        if (Array.isArray(data)) {
          notasArray = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          notasArray = data.data;
        } else if (data && data.notaRecepcionesSinAgrupar && Array.isArray(data.notaRecepcionesSinAgrupar)) {
          notasArray = data.notaRecepcionesSinAgrupar;
        } else {
          notasArray = [];
        }
        
        const newData = notasArray || [];
        const dataChanged = this.hasDataChanged(this.notasSinAgrupar, newData, 'id');
        
        this.notasSinAgrupar = newData;
        this.loadingCoordinator.dataChangeFlags.notasChanged = dataChanged;
        
        if (dataChanged) {
          this.computeNotasProperties();
        }
        
        this.loadingNotas = false;
        this.onDataSourceLoaded('notas');
      },
      error: (error) => {
        console.error('Error loading notas sin agrupar:', error);
        this.notificacionService.openWarn('Error al cargar las notas sin agrupar');
        this.loadingNotas = false;
        this.onDataSourceLoaded('notas');
      }
    });
  }

    private loadGruposCreadosOptimized(): void {
    // SIMPLIFIED: Only load grupos created specifically for this pedido
    // Using the new dedicated query for grupos by pedido ID
    if (!this.pedido?.id) {
      return;
    }

    this.loadingGrupos = true;
    
    // Use the new pedido-specific query to get ALL grupos for this pedido
    // Regardless of SolicitudPago status - shows creation history
    this.genericCrudService.onCustomQuery(
      this.getGruposPorPedidoGQL,
      { 
        pedidoId: this.pedido.id.toString(),
        page: 0,
        size: 999 // Get all for this pedido - should be small number
      }
    ).pipe(untilDestroyed(this)).subscribe({
      next: (response) => {
        // Extract grupos from the pedido-specific query
        let gruposFromPedido = [];
        
        if (response && response.getContent) {
          gruposFromPedido = response.getContent;
        } else if (response && Array.isArray(response)) {
          gruposFromPedido = response;
        } else if (response && response.data && response.data.getContent) {
          gruposFromPedido = response.data.getContent;
        } else if (response && response.getGruposPorPedido) {
          const queryData = response.getGruposPorPedido;
          if (queryData.getContent) {
            gruposFromPedido = queryData.getContent;
          }
        }
        
        // Transform grupos for display - all are "local" to this pedido
        const transformedGrupos: NotaRecepcionAgrupadaInfo[] = gruposFromPedido.map(grupo => {
          // Enhanced business logic for CONCLUIDO grupos with SolicitudPago
          const hasSolicitudPago = !!grupo.solicitudPago;
          const solicitudPagoHasPago = hasSolicitudPago && !!grupo.solicitudPago.pago?.id;
          const isConcluido = grupo.estado === 'CONCLUIDO';
          
          // Business rules:
          // - Can add notes: Only if not CONCLUIDO
          // - Can eliminate: If not CONCLUIDO OR (is CONCLUIDO + has SolicitudPago + SolicitudPago has NO pago)
          // - Can view SolicitudPago: If has SolicitudPago
          const puedeAgregarNotas = !isConcluido;
          const puedeEliminar = !isConcluido || (isConcluido && hasSolicitudPago && !solicitudPagoHasPago);
          const puedeVerSolicitudPago = hasSolicitudPago;
          
          return {
            grupo: grupo,
            notasAsignadas: [], // Will be populated if needed
            valorTotal: grupo.valorTotal || 0,
            puedeAgregarNotas: puedeAgregarNotas,
            puedeEliminar: puedeEliminar,
            puedeVerSolicitudPago: puedeVerSolicitudPago,
            esGrupoExterno: false // All grupos are "local" to this pedido
          };
        });
        
        const newData = transformedGrupos;
        const dataChanged = this.hasDataChanged(this.gruposCreados, newData, 'grupo.id');
        
        this.gruposCreados = newData;
        this.loadingCoordinator.dataChangeFlags.gruposChanged = dataChanged;
        
        if (dataChanged) {
          this.computeGruposProperties();
        }
        
        this.loadingGrupos = false;
        this.onDataSourceLoaded('grupos');
        
        console.log('Grupos loaded for pedido:', this.pedido.id, 'Count:', this.gruposCreados.length);
      },
      error: (error) => {
        console.error('Error loading grupos:', error);
        this.gruposCreados = [];
        this.loadingCoordinator.dataChangeFlags.gruposChanged = true;
        this.computeGruposProperties();
        this.loadingGrupos = false;
        this.onDataSourceLoaded('grupos');
      }
    });
  }

  // Pagination helper methods
  private resetGruposPagination(): void {
    this.gruposPagination = {
      currentPage: 0,
      pageSize: 10,
      totalPages: 0,
      totalElements: 0,
      hasNext: false,
      hasPrevious: false,
      isFirst: true,
      isLast: true
    };
  }

  // Pagination event handlers
  onGruposPageChange(event: any): void {
    this.gruposPagination.currentPage = event.pageIndex;
    this.gruposPagination.pageSize = event.pageSize;
    
    // Reload grupos with new pagination settings
    this.loadDataSource('grupos');
  }

  onGruposPageSizeChange(newPageSize: number): void {
    this.gruposPagination.pageSize = newPageSize;
    this.gruposPagination.currentPage = 0; // Reset to first page
    
    // Reload grupos with new page size
    this.loadDataSource('grupos');
  }

  // TrackBy function for grupos list performance
  trackGrupoById(index: number, grupo: NotaRecepcionAgrupadaInfo): number {
    return grupo.grupo.id;
  }

  private loadSummaryOptimized(): void {
    if (!this.pedido?.id) return;

    this.loadingSummary = true;
    this.genericCrudService.onCustomQuery(
      this.getSolicitudPagoSummaryGQL,
      { pedidoId: this.pedido.id }
    ).pipe(untilDestroyed(this)).subscribe({
      next: (data) => {
        const newData = data || {
          totalNotas: 0,
          notasAgrupadas: 0,
          notasSinAgrupar: 0,
          totalGrupos: 0,
          valorTotalNotas: 0,
          valorTotalAgrupado: 0,
          puedeProgresar: false
        };
        
        const dataChanged = JSON.stringify(this.summaryData) !== JSON.stringify(newData);
        
        this.summaryData = newData;
        this.loadingCoordinator.dataChangeFlags.summaryChanged = dataChanged;
        
        if (dataChanged) {
        this.updateStepValidation();
        }
        
        this.loadingSummary = false;
        this.onDataSourceLoaded('summary');
      },
      error: (error) => {
        console.error('Error loading summary:', error);
        this.loadingSummary = false;
        this.onDataSourceLoaded('summary');
      }
    });
  }

  // Data change detection helper
  private hasDataChanged(oldData: any[], newData: any[], idPath: string): boolean {
    if (oldData.length !== newData.length) {
      return true;
    }

    const oldIds = oldData.map(item => this.getNestedProperty(item, idPath)).sort();
    const newIds = newData.map(item => this.getNestedProperty(item, idPath)).sort();
    
    return JSON.stringify(oldIds) !== JSON.stringify(newIds);
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  updateStepValidation(): void {
    const isValid = this.validateStepCompletion();
    this.stepValidChange.emit(isValid);
  }

  // Debounced computed properties update
  private triggerComputedPropertiesUpdate(): void {
    this.computedPropertiesUpdateSubject.next();
  }

  private executeComputedPropertiesUpdate(): void {
    // Navigation properties
    this.canProceedToNextStep = this.summaryData.puedeProgresar && this.isStepActive;
    
    // Display logic properties - Always show panels when step is active for better UX
    this.showLeftPanel = this.isStepActive; // Always show to explicitly indicate notas state
    this.showRightPanel = this.isStepActive; // Always show to explicitly indicate grupos state
    this.showNoDataMessage = this.isStepActive && this.notasSinAgrupar.length === 0 && this.gruposCreados.length === 0 && this.summaryData.totalGrupos === 0;
    
    // Selection properties
    this.showSelectionActions = this.notasSeleccionadas.size > 0;
  }

  // Selection methods
  toggleNotaSelection(nota: NotaRecepcion): void {
    if (this.notasSeleccionadas.has(nota.id)) {
      this.notasSeleccionadas.delete(nota.id);
    } else {
      this.notasSeleccionadas.add(nota.id);
    }
    this.computeNotasProperties();
    this.triggerComputedPropertiesUpdate();
  }

  clearSelection(): void {
    this.notasSeleccionadas.clear();
    this.computeNotasProperties();
    this.triggerComputedPropertiesUpdate();
  }

  // Grupo management actions
  onEliminarGrupo(grupoInfo: NotaRecepcionAgrupadaInfo): void {
    if (!grupoInfo || !grupoInfo.grupo) {
      this.notificacionService.openWarn('Error: Información del grupo no disponible');
      return;
    }

    // Check if grupo can be deleted (business rules validation)
    if (!grupoInfo.puedeEliminar) {
      this.notificacionService.openWarn('Este grupo no puede ser eliminado en su estado actual');
      return;
    }

    const hasSolicitudPago = !!grupoInfo.grupo.solicitudPago;
    const solicitudPagoId = hasSolicitudPago ? grupoInfo.grupo.solicitudPago.id : null;
    
    const title = `Eliminar Grupo #${grupoInfo.grupo.id}`;
    const message1 = `¿Está seguro de eliminar este grupo?`;
    const warnings = [
      `Proveedor: ${grupoInfo.grupo.proveedor?.persona?.nombre || 'N/A'}`,
      `Estado: ${grupoInfo.grupo.estado}`,
      `Cantidad de notas: ${grupoInfo.grupo.cantNotas || 0}`,
      `Las notas quedarán sin agrupar y deberán ser reagrupadas`
    ];

    // Add warning about SolicitudPago deletion if applicable
    if (hasSolicitudPago) {
      warnings.push(`⚠️ ATENCIÓN: También se eliminará la Solicitud de Pago #${solicitudPagoId} asociada a este grupo`);
    }
    
    warnings.push(`Esta acción no se puede deshacer`);

    this.dialogosService.confirm(
      title,
      message1,
      'Información del grupo a eliminar:',
      warnings,
      true, // action = true means "Sí" and "No" buttons
      'Eliminar',
      'Cancelar'
    ).subscribe(result => {
      if (result) {
        this.ejecutarEliminacionGrupo(grupoInfo.grupo.id);
      }
    });
  }

  /**
   * Execute the grupo deletion with backend call
   */
  private ejecutarEliminacionGrupo(grupoId: number): void {
    this.processingGrouping = true;

    this.genericCrudService.onCustomMutation(
      this.eliminarNotaRecepcionAgrupadaGQL,
      { grupoId: grupoId }
    ).pipe(untilDestroyed(this)).subscribe({
      next: (result) => {
        const deletionResult = result;
        
        if (deletionResult?.success) {
          this.notificacionService.openSucess(
            deletionResult.mensaje || `Grupo eliminado exitosamente. ${deletionResult.notasAfectadas?.length || 0} notas liberadas.`
          );
          
          // Mark data as changed for intelligent reload
          this.loadingCoordinator.dataChangeFlags = {
            notasChanged: true,
            gruposChanged: true,
            summaryChanged: true
          };
          
          // Reload data to reflect changes with delay for backend consistency
          setTimeout(() => {
            this.loadDataIntelligently('delete_group');
          }, 500);
          
        } else {
          this.notificacionService.openWarn(
            deletionResult?.mensaje || 'Error al eliminar el grupo'
          );
        }
        
        this.processingGrouping = false;
      },
      error: (error) => {
        console.error('Error deleting grupo:', error);
        this.notificacionService.openWarn('Error al eliminar el grupo');
        this.processingGrouping = false;
      }
    });
  }

  onGestionarGrupo(grupoInfo: NotaRecepcionAgrupadaInfo): void {
    if (!grupoInfo || !grupoInfo.grupo) {
      this.notificacionService.openWarn('Error: Información del grupo no disponible');
      return;
    }

    if (!this.pedido) {
      this.notificacionService.openWarn('Error: No se encontró el pedido');
      return;
    }

    // Open the new gestionar grupo dialog
    const dialogData: GestionarGrupoDialogData = {
      grupo: grupoInfo.grupo,
      pedido: this.pedido,
      puedeEliminar: grupoInfo.puedeEliminar,
      puedeAgregarNotas: grupoInfo.puedeAgregarNotas
    };

    const dialogRef = this.matDialog.open(GestionarGrupoDialogComponent, {
      data: dialogData,
      width: '60%',
      height: '70%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false
    });

    // Setup interval to check for changes without closing the dialog
    const changeCheckInterval = setInterval(() => {
      if (dialogRef.componentInstance && (dialogRef.componentInstance as any)._lastChangeResult) {
        const result = (dialogRef.componentInstance as any)._lastChangeResult;
        
        if (result?.accion === 'REABRIR_GRUPO') {
          // Handle grupo reopening - refresh data and notify parent if pedido estado changed
          this.loadDataIntelligently('step_change');
          
          if (result.pedidoEstadoCambiado) {
            // Emit event to parent component to refresh pedido data
            this.pedidoChange.emit(this.pedido);
          }
          
          // Clear the change result to avoid processing it again
          (dialogRef.componentInstance as any)._lastChangeResult = null;
        } else if (result?.accion === 'DESVINCULAR_NOTA') {
          // Handle nota desvinculation - refresh both notas sin agrupar and grupos
          this.loadDataIntelligently('assign_notes'); // This will refresh notas, grupos, and summary
          
          // Clear the change result to avoid processing it again
          (dialogRef.componentInstance as any)._lastChangeResult = null;
        }
      }
    }, 1000);

    dialogRef.afterClosed().subscribe((result: GestionarGrupoDialogResult) => {
      // Clear the interval when dialog closes
      clearInterval(changeCheckInterval);
      
      if (result?.accion === 'ELIMINAR_GRUPO') {
        // Execute grupo deletion
        this.ejecutarEliminacionGrupo(result.grupoAfectado.id);
      } else if (result?.accion === 'EDITAR_NOTA') {
        // TODO: Navigate to nota editing or open nota details dialog
        this.notificacionService.openSucess(`Función de editar nota será implementada próximamente`);
        console.log('Edit nota requested:', result.notaSeleccionada);
      } else if (result?.accion === 'REABRIR_GRUPO') {
        // Handle grupo reopening - refresh data and notify parent if pedido estado changed
        this.loadDataIntelligently('step_change');
        
        if (result.pedidoEstadoCambiado) {
          // Emit event to parent component to refresh pedido data
          this.pedidoChange.emit(this.pedido);
        }
        
        this.notificacionService.openSucess(
          `Grupo #${result.grupoAfectado?.id} reabierto exitosamente. ` +
          `El proceso de solicitud de pago debe ser concluido nuevamente.`
        );
      } else if (result?.accion === 'DESVINCULAR_NOTA') {
        // Handle nota desvinculation - refresh both notas sin agrupar and grupos
        this.loadDataIntelligently('assign_notes'); // This will refresh notas, grupos, and summary
        
        this.notificacionService.openSucess(
          `Nota #${result.notaSeleccionada?.numero} desvinculada exitosamente. ` +
          `Las listas han sido actualizadas.`
        );
      }
    });
  }

  /**
   * NEW: Open dialog to view SolicitudPago details
   * This method will open a dedicated dialog for viewing/managing the SolicitudPago
   * Dialog implementation will be added later
   */
  onVerSolicitudPago(grupoInfo: NotaRecepcionAgrupadaInfo): void {
    if (!grupoInfo || !grupoInfo.grupo || !grupoInfo.grupo.solicitudPago) {
      this.notificacionService.openWarn('Error: No se encontró la solicitud de pago asociada');
      return;
    }

    // TODO: Implement dedicated SolicitudPago dialog
    // For now, show basic information using the confirmation dialog
    const solicitudPago = grupoInfo.grupo.solicitudPago;
    const title = `Solicitud de Pago #${solicitudPago.id}`;
    const message1 = `Estado: ${solicitudPago.estado || 'N/A'}`;
    const detailsMessages = [
      `Grupo asociado: #${grupoInfo.grupo.id}`,
      `Proveedor: ${grupoInfo.grupo.proveedor?.persona?.nombre || 'N/A'}`,
      `Valor total: ${this.formatCurrency(grupoInfo.valorTotal)}`,
      `Fecha creación: ${this.formatDate(solicitudPago.creadoEn)}`,
      `Usuario creación: ${solicitudPago.usuario?.nickname || solicitudPago.usuario?.persona?.nombre || 'N/A'}`
    ];

    if (solicitudPago.pago) {
      detailsMessages.push(`--- PAGO ASOCIADO ---`);
      detailsMessages.push(`Pago #${solicitudPago.pago.id}`);
      detailsMessages.push(`Estado: ${solicitudPago.pago.estado}`);
      detailsMessages.push(`Fecha: ${this.formatDate(solicitudPago.pago.creadoEn)}`);
      detailsMessages.push(`Usuario pago: ${solicitudPago.pago.usuario?.nickname || solicitudPago.pago.usuario?.persona?.nombre || 'N/A'}`);
    } else {
      detailsMessages.push(`--- SIN PAGO ASOCIADO ---`);
      detailsMessages.push(`Esta solicitud aún no tiene un pago registrado`);
    }

    this.dialogosService.confirm(
      title,
      message1,
      'Detalles de la solicitud de pago:',
      detailsMessages,
      false, // action = false means only "Cerrar" button
      null,
      null
    ).subscribe(result => {
      // TODO: Later we can add navigation to SolicitudPago management
      console.log('Ver Solicitud Pago clicked for:', solicitudPago.id);
    });
  }

  // Grouping actions with optimized data handling
  onCrearGrupoNuevo(): void {
    if (this.notasSeleccionadas.size === 0) {
      this.notificacionService.openWarn('Seleccione al menos una nota para crear un grupo');
      return;
    }

    if (!this.pedido) {
      this.notificacionService.openWarn('Error: No se encontró el pedido');
      return;
    }

    const notasSeleccionadasArray = this.notasSinAgrupar.filter(nota => 
      this.notasSeleccionadas.has(nota.id)
    );

    const dialogData: CrearGrupoDialogData = {
      pedido: this.pedido,
      notasSeleccionadas: notasSeleccionadasArray
    };

    const dialogRef = this.matDialog.open(CrearGrupoDialogComponent, {
      data: dialogData,
      width: '900px',
      maxWidth: '95vw',
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result: CrearGrupoDialogResult) => {
      if (result?.accion === 'CREAR') {
        // Clear selection
        this.clearSelection();
        
        // Mark data as changed for intelligent reload
        this.loadingCoordinator.dataChangeFlags = {
          notasChanged: true,
          gruposChanged: true,
          summaryChanged: true
        };
        
        // Reload only affected data sources with delay for backend consistency
        setTimeout(() => {
          this.loadDataIntelligently('create_group');
        }, 500);
        
        this.notificacionService.openSucess(
          `Grupo creado exitosamente con ${result.notasAfectadas.length} notas`
        );
      }
    });
  }

  // Computed properties calculation
  private computeNotasProperties(): void {
    this.enhancedNotasSinAgrupar = this.notasSinAgrupar.map(nota => ({
      ...nota,
      computedValorDisplay: this.formatCurrency(nota.valor || 0),
      computedFechaDisplay: this.formatDate(nota.fecha),
      computedItemsDisplay: `${nota.cantidadItens || 0} items`,
      computedSeleccionado: this.notasSeleccionadas.has(nota.id)
    }));
  }

  private computeGruposProperties(): void {
    this.enhancedGruposCreados = this.gruposCreados.map(grupoInfo => ({
      ...grupoInfo,
      computedTituloDisplay: this.getGrupoTitulo(grupoInfo),
      computedInfoDisplay: this.getGrupoInfo(grupoInfo),
      computedValorDisplay: this.formatCurrency(grupoInfo.valorTotal),
      computedNotasDisplay: this.getGrupoNotasDisplay(grupoInfo),
      computedEstadoChipClass: this.getEstadoChipClass(grupoInfo.grupo.estado),
      computedPuedeGestionar: grupoInfo.puedeAgregarNotas || grupoInfo.puedeEliminar, // Enable if can add notes OR can eliminate
      computedMostrarVerSolicitudPago: grupoInfo.puedeVerSolicitudPago
    }));
  }

  // Helper methods for computed properties
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount).replace('PYG', 'Gs.');
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-PY');
  }

  private getGrupoTitulo(grupoInfo: NotaRecepcionAgrupadaInfo): string {
    if (grupoInfo.esGrupoExterno) {
      return `Grupo Existente #${grupoInfo.grupo.id}`;
    }
    return `Grupo #${grupoInfo.grupo.id} - Nuevo`;
  }

  private getGrupoInfo(grupoInfo: NotaRecepcionAgrupadaInfo): string {
    const fecha = this.formatDate(grupoInfo.grupo.creadoEn);
    const usuario = grupoInfo.grupo.usuario?.persona?.nombre || grupoInfo.grupo.usuario?.nickname || 'Usuario';
    return `Creado: ${fecha} por ${usuario}`;
  }

  private getGrupoNotasDisplay(grupoInfo: NotaRecepcionAgrupadaInfo): string {
    const count = grupoInfo.notasAsignadas.length;
    return `${count} nota${count !== 1 ? 's' : ''}`;
  }

  private getEstadoChipClass(estado: NotaRecepcionAgrupadaEstado): string {
    switch (estado) {
      case NotaRecepcionAgrupadaEstado.EN_RECEPCION:
        return 'estado-chip-warning';
      case NotaRecepcionAgrupadaEstado.CONCLUIDO:
        return 'estado-chip-success';
      case NotaRecepcionAgrupadaEstado.CANCELADO:
        return 'estado-chip-danger';
      default:
        return 'estado-chip-default';
    }
  }

  // Business logic validation
  private validateStepCompletion(): boolean {
    return this.summaryData.notasSinAgrupar === 0 &&
           this.summaryData.totalGrupos > 0;
  }

  private canUseExistingGroup(grupo: NotaRecepcionAgrupada): boolean {
    return grupo.proveedor.id === this.pedido?.proveedor.id &&
           grupo.estado !== NotaRecepcionAgrupadaEstado.CONCLUIDO &&
           (!grupo.solicitudPago?.pago || 
            grupo.solicitudPago.pago.estado !== PagoEstado.CONCLUIDO);
  }

  /**
   * Public method for parent stepper to call when finalizing this step
   * Returns a promise that resolves when finalization is complete
   */
  public async finalizarSolicitudPago(): Promise<boolean> {
    if (!this.canProceedToNextStep) {
      this.notificacionService.openWarn('Complete la agrupación antes de finalizar');
      return false;
    }

    if (!this.pedido) {
      this.notificacionService.openWarn('Error: No se encontró el pedido');
      return false;
    }

    // Show confirmation dialog
    const dialogData: ConfirmarFinalizacionDialogData = {
      pedido: this.pedido,
      gruposCreados: this.gruposCreados,
      summaryData: this.summaryData
    };

    try {
      const dialogResult = await this.showConfirmationDialog(dialogData);
      if (dialogResult?.accion === 'FINALIZAR') {
        return await this.ejecutarFinalizacion();
      }
      return false;
    } catch (error) {
      console.error('Error in finalization dialog:', error);
      return false;
    }
  }

  /**
   * Show confirmation dialog as a promise
   */
  private showConfirmationDialog(dialogData: ConfirmarFinalizacionDialogData): Promise<ConfirmarFinalizacionDialogResult> {
    return new Promise((resolve) => {
      const dialogRef = this.matDialog.open(ConfirmarFinalizacionDialogComponent, {
        data: dialogData,
        width: '50%',
        disableClose: true,
        autoFocus: false
      });

      dialogRef.afterClosed().subscribe((result: ConfirmarFinalizacionDialogResult) => {
        resolve(result);
      });
    });
  }

  crearSolicitudPago(): void {
    
  }

  /**
   * Execute the finalization logic - Simplified workflow
   * Creates ONE SolicitudPago for all grupos in this pedido
   */
  private async ejecutarFinalizacion(): Promise<boolean> {
    if (!this.pedido?.id) return false;

    this.processingGrouping = true;
    
    return new Promise<boolean>((resolve) => {
      console.log('Starting simplified finalization for pedido:', this.pedido.id);
      console.log('Grupos to finalize:', this.gruposCreados.length);
      
      this.genericCrudService.onCustomMutation(
        this.finalizarSolicitudPagoStepGQL,
        { pedidoId: this.pedido.id }
      ).pipe(untilDestroyed(this)).subscribe({
        next: (result) => {
          console.log('Finalization result:', result);
          console.log('Result structure:', Object.keys(result || {}));

          // Extract SolicitudPago array from GraphQL response using project pattern
          const solicitudesCreadas = result;
          console.log('Extracted solicitudes:', solicitudesCreadas);
          
          if (solicitudesCreadas && solicitudesCreadas.length > 0) {
            console.log(`Successfully created ${solicitudesCreadas.length} SolicitudPago:`, 
              solicitudesCreadas.map(s => s.id));
            
            // Update pedido estado to CONCLUIDO
            this.pedido.estado = PedidoEstado.CONCLUIDO;
            this.pedidoChange.emit(this.pedido);
            
            this.triggerComputedPropertiesUpdate();
            
            this.notificacionService.openSucess(`Solicitudes de pago creadas exitosamente (${solicitudesCreadas.length})`);
            this.processingGrouping = false;
            resolve(true);
          } else {
            console.warn('No solicitudes were created');
            this.notificacionService.openWarn('No se pudieron crear las solicitudes de pago');
            this.processingGrouping = false;
            resolve(false);
          }
        },
        error: (error) => {
          console.error('Error in simplified finalization:', error);
          
          let errorMessage = 'Error al crear la solicitud de pago';
          if (error && error.message) {
            errorMessage += `: ${error.message}`;
          }
          
          this.notificacionService.openWarn(errorMessage);
          this.processingGrouping = false;
          resolve(false);
        }
      });
    });
  }

  /**
   * NEW METHOD: Assign selected notes directly to a specific grupo
   */
  onAsignarNotasAGrupo(grupoInfo: NotaRecepcionAgrupadaInfo): void {
    if (this.notasSeleccionadas.size === 0) {
      this.notificacionService.openWarn('Seleccione al menos una nota para asignar al grupo');
      return;
    }

    if (!grupoInfo || !grupoInfo.grupo) {
      this.notificacionService.openWarn('Error: Información del grupo no disponible');
      return;
    }

    if (!grupoInfo.puedeAgregarNotas) {
      this.notificacionService.openWarn('Este grupo no puede recibir más notas en su estado actual');
      return;
    }

    if (!this.pedido) {
      this.notificacionService.openWarn('Error: No se encontró el pedido');
      return;
    }

    const notasSeleccionadasArray = this.notasSinAgrupar.filter(nota => 
      this.notasSeleccionadas.has(nota.id)
    );

    // Show confirmation dialog
    const title = `Confirmar Asignación`;
    const message1 = `¿Asignar ${notasSeleccionadasArray.length} nota(s) al Grupo #${grupoInfo.grupo.id}?`;
    const details = [
      `Grupo: #${grupoInfo.grupo.id}`,
      `Proveedor: ${grupoInfo.grupo.proveedor?.persona?.nombre || 'N/A'}`,
      `Estado: ${grupoInfo.grupo.estado}`,
      `Notas actuales: ${grupoInfo.grupo.cantNotas || 0}`,
      `Notas a asignar: ${notasSeleccionadasArray.length}`
    ];

    this.dialogosService.confirm(
      title,
      message1,
      'Detalles de la asignación:',
      details,
      true, // action = true means "Sí" and "No" buttons
      'Asignar',
      'Cancelar'
    ).subscribe(result => {
      if (result) {
        this.ejecutarAsignacionDirecta(grupoInfo.grupo.id, notasSeleccionadasArray.map(n => n.id));
      }
    });
  }

  /**
   * Execute the direct assignment with backend call
   */
  private ejecutarAsignacionDirecta(grupoId: number, notaIds: number[]): void {
    this.processingGrouping = true;

    this.genericCrudService.onCustomMutation(
      this.asignarNotasAGrupoGQL,
      { grupoId: grupoId, notaRecepcionIds: notaIds }
    ).pipe(untilDestroyed(this)).subscribe({
      next: (result) => {
        const assignmentResult = result.data;
        
        if (assignmentResult?.success) {
          this.notificacionService.openSucess(
            assignmentResult.mensaje || `${notaIds.length} notas asignadas al grupo exitosamente`
          );
          
          // Clear selection
          this.clearSelection();
          
          // Mark data as changed for intelligent reload
          this.loadingCoordinator.dataChangeFlags = {
            notasChanged: true,
            gruposChanged: true,
            summaryChanged: true
          };
          
          // Reload data to reflect changes with delay for backend consistency
          setTimeout(() => {
            this.loadDataIntelligently('assign_notes');
          }, 500);
          
        } else {
          this.notificacionService.openWarn(
            assignmentResult?.mensaje || 'Error al asignar las notas al grupo'
          );
        }
        
        this.processingGrouping = false;
      },
      error: (error) => {
        console.error('Error assigning notes to grupo:', error);
        this.notificacionService.openWarn('Error al asignar las notas al grupo');
        this.processingGrouping = false;
      }
    });
  }
} 