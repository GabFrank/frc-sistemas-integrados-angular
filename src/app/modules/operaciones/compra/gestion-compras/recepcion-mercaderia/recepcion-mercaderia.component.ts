import { Component, Input, Output, OnInit, OnDestroy, ViewChild, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, forkJoin } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Importar modelos reales
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { NotaRecepcion, NotaRecepcionEstado } from '../nota-recepcion.model';
import { NotaRecepcionItem, NotaRecepcionItemEstado } from '../nota-recepcion-item.model';
import { NotaRecepcionItemDistribucion } from '../models/nota-recepcion-item-distribucion.model';
import { Pedido } from '../pedido.model';
import { RecepcionMercaderiaItem } from '../recepcion-mercaderia-item.model';

// Importar servicios
import { PedidoService } from '../../pedido.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { ProcesoEtapaService } from '../proceso-etapa.service';
import { ProcesoEtapaTipo, ProcesoEtapaEstado } from '../proceso-etapa.model';

// Dialog Components
import { RecepcionMercaderiaVerificarItemDialogComponent } from './recepcion-mercaderia-verificar-item-dialog/recepcion-mercaderia-verificar-item-dialog.component';
import { RecepcionMercaderiaRechazarItemDialogComponent, RecepcionMercaderiaRechazarItemDialogData } from './recepcion-mercaderia-rechazar-item-dialog/recepcion-mercaderia-rechazar-item-dialog.component';
import { VerificacionRapidaSucursalesDialogComponent } from './verificacion-rapida-sucursales-dialog/verificacion-rapida-sucursales-dialog.component';

// Enums y interfaces reales
export enum RecepcionMercaderiaEstado {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA'
}

export interface RecepcionMercaderia {
  id?: number;
  pedidoId: number;
  estado: RecepcionMercaderiaEstado;
  sucursalesSeleccionadas: Sucursal[];
  modoVisualizacion: 'NOTAS' | 'PRODUCTOS';
  mostrarSucursalesAlVerificar: boolean;
  fechaInicio?: Date;
  fechaFin?: Date;
  usuarioId?: number;
  creadoEn?: Date;
}



export interface RecepcionMercaderiaNota {
  id?: number;
  recepcionMercaderiaId: number;
  notaRecepcionId: number;
  creadoEn?: Date;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-recepcion-mercaderia',
  templateUrl: './recepcion-mercaderia.component.html',
  styleUrls: ['./recepcion-mercaderia.component.scss']
})
export class RecepcionMercaderiaComponent implements OnInit, OnDestroy {
  @Input() pedidoId: number;
  @Input() pedido: Pedido;
  @Output() recepcionFinalizada = new EventEmitter<void>();
  
  @ViewChild('sucursalesSelect', { read: MatSelect }) sucursalesSelect!: MatSelect;
  @ViewChild('modoVisualizacionSelect', { read: MatSelect }) modoVisualizacionSelect!: MatSelect;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('notasPaginator', { read: MatPaginator }) notasPaginator!: MatPaginator;
  @ViewChild('itemsPaginator', { read: MatPaginator }) itemsPaginator!: MatPaginator;

  private destroy$ = new Subject<void>();
  private filtroTextoSubject$ = new Subject<string>();

  // Estado de carga
  loading = false;
  loadingNotas = false;
  loadingItems = false;
  loadingSucursales = false;
  isInitialLoadComplete = false; // Control para carga inicial

  // Formulario de configuración
  configuracionForm: FormGroup;

  // Datos de configuración
  sucursales: Sucursal[] = [];
  sucursalesSeleccionadas: Sucursal[] = [];
  modoVisualizacion: 'NOTAS' | 'PRODUCTOS' = 'NOTAS';
  mostrarSucursalesAlVerificar = false;

  // Filtro de verificación
  // filtroVerificacion: 'TODOS' | 'PENDIENTES' | 'VERIFICADOS' = 'PENDIENTES'; // Eliminado - ahora en FormGroup

  // Datos de recepción automática
  recepcionMercaderiaId?: number;
  isRecepcionCreada = false;
  isLoadingRecepcion = false;

  // Getter para filtroVerificacion desde FormGroup
  filtroVerificacion(): 'TODOS' | 'PENDIENTES' | 'VERIFICADOS' | 'RECHAZADOS' {
    return this.configuracionForm.get('filtroVerificacion')?.value || 'PENDIENTES';
  }

  // Datos de notas de recepción
  notasRecepcion: NotaRecepcion[] = [];
  notaSeleccionada: NotaRecepcion | null = null;
  notasDataSource = new MatTableDataSource<NotaRecepcion>([]);
  notasDisplayedColumns = ['numero', 'fecha', 'monto', 'estado', 'acciones'];

  // Datos de ítems
  items: NotaRecepcionItem[] = [];
  itemsDataSource = new MatTableDataSource<NotaRecepcionItem>([]);
  // Columnas de la tabla de ítems
  itemsDisplayedColumns = ['seleccionar', 'producto', 'presentacion', 'cantidadEsperada', 'cantidadRecibida', 'cantidadRechazada', 'estado', 'acciones'];
  
  // Selección de items para recepción
  selectedItems: NotaRecepcionItem[] = [];
  selectAllItems = false;

  // Paginación
  notasPageSize = 10;
  notasPageIndex = 0;
  notasTotalElements = 0;
  
  itemsPageSize = 10;
  itemsPageIndex = 0;
  itemsTotalElements = 0;

  // Propiedades computadas para UI (siguiendo regla de no funciones en templates)
  sucursalesSeleccionadasTextComputed = '';
  isToggleSucursalesVisibleComputed = false;
  isToggleSucursalesEnabledComputed = false;
  configuracionFormValidComputed = false;
  notasCountComputed = 0;
  itemsCountComputed = 0;
  sucursalesSeleccionadasCountComputed = 0;
  todasSucursalesSeleccionadasComputed = false;
  haySucursalesSeleccionadasComputed = false;

  // Control del botón de finalizar recepción
  botonFinalizarHabilitadoComputed = false;
  recepcionFinalizadaComputed = false;
  
  // Control de botones de recepción
  canRecepcionarSeleccionComputed = false;
  canRecepcionarTodoComputed = false;
  canDeshacerVerificacionTodoComputed = false;
  canDeshacerSeleccionComputed = false;
  tieneSeleccionMixtaComputed = false;
  todosItemsVerificadosComputed = false;
  tieneItemsPendientesOparcialesComputed = false;
  
  // Propiedad para almacenar la etapa actual del proceso
  etapaActualComputed: ProcesoEtapaTipo | null = null;
  etapaEstadoComputed: ProcesoEtapaEstado | null = null;

  // Control de items recién verificados (nueva funcionalidad)
  itemsRecienVerificados: Set<number> = new Set();
  private timeoutsVerificacion: Map<number, any> = new Map();
  itemsParpadeando: Set<number> = new Set();

  // Filtro de texto para búsqueda
  filtroTexto: string = '';
  
  // Flag para controlar carga inicial
  private isInitialNotaLoad = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private procesoEtapaService: ProcesoEtapaService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Configurar debounce para filtro de texto
    this.filtroTextoSubject$
      .pipe(
        debounceTime(500), // Esperar 500ms después de que el usuario deje de escribir
        distinctUntilChanged(), // Solo emitir si el valor cambió
        untilDestroyed(this)
      )
      .subscribe(texto => {
        this.filtroTexto = texto;
        this.ejecutarBusquedaConFiltroTexto();
      });
    
    // Cargar datos iniciales
    this.loadSucursales();
    this.setupFormSubscriptions();
    this.loadNotasRecepcion(); // Cargar datos directamente
    this.loadEtapaActual(); // Cargar etapa actual del proceso
    this.updateComputedProperties();
  }

  ngOnDestroy(): void {
    // Limpiar todos los timeouts de verificación
    this.timeoutsVerificacion.forEach((timeout, itemId) => {
      clearTimeout(timeout);
    });
    this.timeoutsVerificacion.clear();
    
    this.itemsRecienVerificados.clear();
    this.itemsParpadeando.clear();
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.configuracionForm = this.fb.group({
      sucursales: [[], Validators.required],
      modoVisualizacion: ['NOTAS', Validators.required],
      mostrarSucursalesAlVerificar: [false],
      filtroVerificacion: ['PENDIENTES'] // Agregar filtroVerificacion al FormGroup
    });
  }

  private setupFormSubscriptions(): void {
    // Sucursales selection
    this.configuracionForm.get('sucursales')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(sucursales => {
        this.sucursalesSeleccionadas = sucursales || [];
        this.updateComputedProperties();
        
        // Recargar items cuando cambien las sucursales seleccionadas
        this.recargarItemsPorCambioSucursales();
      });

    // Modo visualización
    this.configuracionForm.get('modoVisualizacion')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(modo => {
        this.modoVisualizacion = modo;
        this.updateComputedProperties();
      });

    // Toggle sucursales
    this.configuracionForm.get('mostrarSucursalesAlVerificar')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(mostrar => {
        this.mostrarSucursalesAlVerificar = mostrar;
        this.updateComputedProperties();
      });

    // Filtro de verificación
    this.configuracionForm.get('filtroVerificacion')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(filtro => {
        // No necesitamos asignar a una propiedad, el getter ya obtiene el valor del FormGroup
        
        // Si hay una nota seleccionada, recargar desde el backend con el nuevo filtro
        // Esto asegura que los items se filtren correctamente según el nuevo filtro
        // y mantiene la selección de la nota
        if (this.notaSeleccionada) {
          // Reset a primera página cuando cambia el filtro
          this.itemsPageIndex = 0;
          // Recargar items de la nota seleccionada con el nuevo filtro
          this.loadItemsNotaRecepcion(this.notaSeleccionada.id);
        } else if (this.items.length > 0) {
          // Si no hay nota seleccionada pero hay items cargados, refrescar la tabla localmente
          this.refrescarTablaItems();
        }
      });

    // Form validation
    this.configuracionForm.statusChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
      });
  }

  private updateComputedProperties(): void {
    // Sucursales seleccionadas - filtrar elementos null/undefined
    const sucursalesValidas = this.sucursalesSeleccionadas.filter(s => s !== null && s !== undefined);
    
    // Propiedades computadas de sucursales
    this.sucursalesSeleccionadasTextComputed = sucursalesValidas.length > 0 
      ? sucursalesValidas.map(s => s.nombre).join(', ')
      : 'Ninguna sucursal seleccionada';
    
    this.sucursalesSeleccionadasCountComputed = sucursalesValidas.length;
    this.todasSucursalesSeleccionadasComputed = this.sucursales.length > 0 && sucursalesValidas.length === this.sucursales.length;
    this.haySucursalesSeleccionadasComputed = sucursalesValidas.length > 0;

    // Toggle sucursales
    this.isToggleSucursalesVisibleComputed = this.sucursalesSeleccionadas.length > 1;
    this.isToggleSucursalesEnabledComputed = this.sucursalesSeleccionadas.length > 1;

    // Form validation
    this.configuracionFormValidComputed = this.configuracionForm.valid;

    // Counts
    this.notasCountComputed = this.notasRecepcion.length;
    this.itemsCountComputed = this.items.length;

    // Actualizar propiedades computadas de las notas
    this.notasRecepcion.forEach(nota => {
      this.calculateNotaComputedProperties(nota);
    });

    // Actualizar propiedades computadas de los ítems
    this.updateItemsComputedProperties();

    // Control del botón de finalizar recepción
    // Solo habilitado si:
    // 1. Hay sucursales seleccionadas
    // 2. No está cargando
    // 3. No se ha finalizado
    // 4. La etapa actual es RECEPCION_MERCADERIA con estado EN_PROCESO
    const etapaCorrecta = this.etapaActualComputed === ProcesoEtapaTipo.RECEPCION_MERCADERIA;
    const estadoCorrecto = this.etapaEstadoComputed === ProcesoEtapaEstado.EN_PROCESO;
    this.botonFinalizarHabilitadoComputed = this.haySucursalesSeleccionadasComputed && 
                                           !this.loading && 
                                           !this.recepcionFinalizadaComputed &&
                                           etapaCorrecta &&
                                           estadoCorrecto;
    
    // Lógica simplificada basada en el filtro de verificación
    const filtroActual = this.filtroVerificacion();
    const itemsVisibles = this.itemsDataSource.data;
    const hayItemsSeleccionados = this.selectedItems.length > 0;

    // Calcular propiedades según el filtro
    switch (filtroActual) {
      case 'PENDIENTES':
        // Filtro en PENDIENTES: Solo botones de recepción
        this.canRecepcionarTodoComputed = 
          this.notaSeleccionada !== null && 
          itemsVisibles.length > 0;
        this.canDeshacerVerificacionTodoComputed = false;
        this.canRecepcionarSeleccionComputed = hayItemsSeleccionados;
        this.tieneSeleccionMixtaComputed = false; // No aplica en este filtro
        break;

      case 'VERIFICADOS':
        // Filtro en VERIFICADOS: Solo botones de deshacer
        this.canRecepcionarTodoComputed = false;
        this.canDeshacerVerificacionTodoComputed = 
          this.notaSeleccionada !== null && 
          itemsVisibles.length > 0;
        this.canRecepcionarSeleccionComputed = false;
        this.canDeshacerSeleccionComputed = hayItemsSeleccionados;
        this.tieneSeleccionMixtaComputed = false; // No aplica en este filtro
        break;

      case 'TODOS':
        // Filtro en TODOS: Calcular según selección
        this.tieneSeleccionMixtaComputed = this.detectarSeleccionMixta();
        
        if (this.tieneSeleccionMixtaComputed) {
          // Selección mixta: Deshabilitar todos los botones
          this.canRecepcionarTodoComputed = false;
          this.canDeshacerVerificacionTodoComputed = false;
          this.canRecepcionarSeleccionComputed = false;
        } else {
          // Sin selección mixta: Calcular según estados de items seleccionados o visibles
          const tieneSoloVerificados = hayItemsSeleccionados
            ? this.selectedItems.every(item => item.estadoRecepcion === 'VERIFICADO')
            : itemsVisibles.every(item => item.estadoRecepcion === 'VERIFICADO');
          
          const tieneSoloPendientesOParciales = hayItemsSeleccionados
            ? this.selectedItems.every(item => 
                item.estadoRecepcion === 'PENDIENTE' || item.estadoRecepcion === 'PARCIAL')
            : itemsVisibles.some(item => 
                item.estadoRecepcion === 'PENDIENTE' || item.estadoRecepcion === 'PARCIAL');

          if (tieneSoloVerificados) {
            // Solo verificados: Botones de deshacer
            this.canRecepcionarTodoComputed = false;
            this.canDeshacerVerificacionTodoComputed = 
              this.notaSeleccionada !== null && 
              (hayItemsSeleccionados ? hayItemsSeleccionados : itemsVisibles.length > 0);
            this.canRecepcionarSeleccionComputed = false;
            this.canDeshacerSeleccionComputed = hayItemsSeleccionados;
          } else if (tieneSoloPendientesOParciales) {
            // Solo pendientes/parciales: Botones de recepción
            this.canRecepcionarTodoComputed = 
              this.notaSeleccionada !== null && 
              itemsVisibles.length > 0;
            this.canDeshacerVerificacionTodoComputed = false;
            this.canRecepcionarSeleccionComputed = hayItemsSeleccionados;
            this.canDeshacerSeleccionComputed = false;
          } else {
            // Estados mixtos sin selección: Deshabilitar todo
            this.canRecepcionarTodoComputed = false;
            this.canDeshacerVerificacionTodoComputed = false;
            this.canRecepcionarSeleccionComputed = false;
            this.canDeshacerSeleccionComputed = false;
          }
        }
        break;

      case 'RECHAZADOS':
        // Filtro en RECHAZADOS: Solo botones de deshacer rechazo (similar a VERIFICADOS)
        this.canRecepcionarTodoComputed = false;
        this.canDeshacerVerificacionTodoComputed = 
          this.notaSeleccionada !== null && 
          itemsVisibles.length > 0;
        this.canRecepcionarSeleccionComputed = false;
        this.canDeshacerSeleccionComputed = hayItemsSeleccionados;
        this.tieneSeleccionMixtaComputed = false; // No aplica en este filtro
        break;

      default:
        // Default: Deshabilitar todo
        this.canRecepcionarTodoComputed = false;
        this.canDeshacerVerificacionTodoComputed = false;
        this.canRecepcionarSeleccionComputed = false;
        this.canDeshacerSeleccionComputed = false;
        this.tieneSeleccionMixtaComputed = false;
    }

    // Propiedades computadas adicionales para compatibilidad
    this.todosItemsVerificadosComputed = filtroActual === 'VERIFICADOS' || 
      (filtroActual === 'TODOS' && itemsVisibles.length > 0 && 
       itemsVisibles.every(item => item.estadoRecepcion === 'VERIFICADO'));
    this.tieneItemsPendientesOparcialesComputed = filtroActual === 'PENDIENTES' || 
      (filtroActual === 'TODOS' && itemsVisibles.some(item => 
        item.estadoRecepcion === 'PENDIENTE' || item.estadoRecepcion === 'PARCIAL'));
  }

  private calculateNotaComputedProperties(nota: NotaRecepcion): void {
    // Agregar propiedades computadas a la nota
    (nota as any).montoComputed = this.calculateNotaMonto(nota);
    (nota as any).estadoDisplayNameComputed = this.getNotaEstadoDisplayName(nota.estado);
  }

  private calculateNotaMonto(nota: NotaRecepcion): number {
    // Usar el valorTotal calculado por el backend
    return nota.valorTotal || 0;
  }

  private getNotaEstadoDisplayName(estado: NotaRecepcionEstado): string {
    switch (estado) {
      case NotaRecepcionEstado.CONCILIADA:
        return 'Conciliada';
      case NotaRecepcionEstado.PENDIENTE_CONCILIACION:
        return 'Pendiente Conciliación';
      case NotaRecepcionEstado.EN_RECEPCION:
        return 'En Recepción';
      case NotaRecepcionEstado.RECEPCION_PARCIAL:
        return 'Recepción Parcial';
      case NotaRecepcionEstado.RECEPCION_COMPLETA:
        return 'Recepción Completa';
      case NotaRecepcionEstado.CERRADA:
        return 'Cerrada';
      default:
        return estado;
    }
  }

  private loadSucursales(): void {
    if (!this.pedidoId) {
      console.warn('No hay pedidoId para cargar sucursales');
      return;
    }

    this.loadingSucursales = true;
    
    // Deshabilitar controles durante la carga
    this.disableFormControls();
    
    this.pedidoService.onGetSucursalesDisponiblesRecepcionFisica(this.pedidoId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (sucursales) => {
          this.sucursales = sucursales;
          
          // Preseleccionar todas las sucursales automáticamente
          this.sucursalesSeleccionadas = [...this.sucursales];
          
          // Configurar valores por defecto
          this.configuracionForm.patchValue({
            sucursales: this.sucursalesSeleccionadas,
            modoVisualizacion: 'NOTAS',
            mostrarSucursalesAlVerificar: false,
            filtroVerificacion: 'PENDIENTES' // Establecer valor por defecto para el filtro
          });
          
          // Habilitar campos después de la carga inicial
          this.isInitialLoadComplete = true;
          this.enableFormControls();
          
          this.loadingSucursales = false;
          this.updateComputedProperties();
        },
        error: (error) => {
          console.error('Error cargando sucursales disponibles:', error);
          this.sucursales = [];
          this.sucursalesSeleccionadas = [];
          this.isInitialLoadComplete = true;
          this.enableFormControls();
          this.loadingSucursales = false;
          this.updateComputedProperties();
        }
      });
  }

  /**
   * Deshabilita los controles del formulario durante la carga inicial
   */
  private disableFormControls(): void {
    this.configuracionForm.get('sucursales')?.disable();
    this.configuracionForm.get('modoVisualizacion')?.disable();
    this.configuracionForm.get('mostrarSucursalesAlVerificar')?.disable();
    this.configuracionForm.get('filtroVerificacion')?.disable();
  }

  /**
   * Habilita los controles del formulario después de la carga inicial
   */
  private enableFormControls(): void {
    this.configuracionForm.get('sucursales')?.enable();
    this.configuracionForm.get('modoVisualizacion')?.enable();
    this.configuracionForm.get('mostrarSucursalesAlVerificar')?.enable();
    this.configuracionForm.get('filtroVerificacion')?.enable();
    
    // Aplicar lógica de habilitación específica
    this.updateFormControlsState();
  }

  /**
   * Actualiza el estado de los controles basado en las condiciones actuales
   */
  private updateFormControlsState(): void {
    // Mostrar sucursales al verificar: solo habilitado si hay sucursales seleccionadas
    if (this.sucursalesSeleccionadas.length === 0) {
      this.configuracionForm.get('mostrarSucursalesAlVerificar')?.disable();
    } else {
      this.configuracionForm.get('mostrarSucursalesAlVerificar')?.enable();
    }

    // Filtro de verificación: solo habilitado si hay nota seleccionada
    if (!this.notaSeleccionada) {
      this.configuracionForm.get('filtroVerificacion')?.disable();
    } else {
      this.configuracionForm.get('filtroVerificacion')?.enable();
    }
  }

  // Método para recargar items cuando cambian las sucursales seleccionadas
  private recargarItemsPorCambioSucursales(): void {
    if (this.notaSeleccionada) {
      this.itemsPageIndex = 0; // Reset a primera página
      this.loadItemsNotaRecepcion(this.notaSeleccionada.id);
    }
  }

  onSelectNotaRecepcion(nota: NotaRecepcion): void {
    this.notaSeleccionada = nota;
    
    // Marcar como carga inicial para evitar interferencia del debounce
    this.isInitialNotaLoad = true;
    
    // Limpiar filtro de texto al seleccionar nueva nota
    this.filtroTexto = '';
    
    // Limpiar selección de items al cambiar de nota
    this.selectedItems = [];
    this.selectAllItems = false;
    
    // Actualizar estado de controles después de seleccionar nota
    this.updateFormControlsState();
    
    // Cargar items de la nota seleccionada
    // Reset a primera página cuando se selecciona nueva nota
    this.itemsPageIndex = 0;
    this.loadItemsNotaRecepcion(nota.id);
    
    // Reset del flag después de un breve delay
    setTimeout(() => {
      this.isInitialNotaLoad = false;
    }, 1000);
  }

  private loadItemsNotaRecepcion(notaId: number): void {
    this.loadingItems = true;
    
    // Obtener IDs de sucursales seleccionadas
    const sucursalesIds = this.sucursalesSeleccionadas.map(s => s.id);
    
    if (sucursalesIds.length === 0) {
      console.warn('No hay sucursales seleccionadas para filtrar');
      this.items = [];
      this.itemsDataSource.data = this.items;
      this.loadingItems = false;
      this.updateComputedProperties();
      return;
    }
    
    const filtroActual = this.filtroVerificacion();
    const filtroBackend = this.convertirFiltroParaBackend(filtroActual);
    
    // Usar el servicio para cargar items filtrados por sucursales, estado de verificación y texto
    this.pedidoService.onGetNotaRecepcionItemListPorNotaRecepcionIdYSucursales(
      notaId, 
      sucursalesIds, 
      this.itemsPageIndex, 
      this.itemsPageSize,
      filtroBackend,
      this.filtroTexto // ✅ AGREGADO: Enviar filtro de texto al backend
    )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pageInfo) => {
          if (pageInfo && pageInfo.getContent && pageInfo.getContent.length > 0) {
            // Usar directamente los datos del backend
            let items = pageInfo.getContent.map((item: any) => {
              // Los datos ya vienen con los campos de recepción física del backend
              // No necesitamos conversión adicional
              return item;
            });

            // Paginación backend-driven: el total debe venir del backend para que el paginator sea correcto
            this.itemsTotalElements = pageInfo.getTotalElements || 0;

            this.items = items;
          } else {
            this.items = [];
            this.itemsTotalElements = 0;
            console.warn(`No se encontraron items con filtro '${filtroActual}' para la nota de recepción:`, notaId);
          }
          
          // ✅ CORREGIDO: Mostrar todos los items normalmente, solo filtrar por recién verificados si es necesario
          let itemsFiltrados = this.items;
          
          // Si hay items recién verificados, asegurar que estén visibles
          if (this.itemsRecienVerificados.size > 0) {
            itemsFiltrados = this.items.filter(item => this.debeMostrarItemRecienVerificado(item));
          }
          
          this.itemsDataSource.data = itemsFiltrados;
          this.loadingItems = false;
          this.updateComputedProperties();
        },
        error: (error) => {
          console.error('Error cargando items de nota de recepción:', error);
          this.items = [];
          // ✅ CORREGIDO: Mostrar todos los items normalmente, solo filtrar por recién verificados si es necesario
          let itemsFiltrados = this.items;
          
          // Si hay items recién verificados, asegurar que estén visibles
          if (this.itemsRecienVerificados.size > 0) {
            itemsFiltrados = this.items.filter(item => this.debeMostrarItemRecienVerificado(item));
          }
          
          this.itemsDataSource.data = itemsFiltrados;
          this.loadingItems = false;
          this.updateComputedProperties();
        }
      });
  }

  /**
   * Convierte el filtro del frontend al formato esperado por el backend
   */
  private convertirFiltroParaBackend(filtro: 'TODOS' | 'PENDIENTES' | 'VERIFICADOS' | 'RECHAZADOS'): 'TODOS' | 'PENDIENTES' | 'VERIFICADOS' | 'RECHAZADOS' {
    switch (filtro) {
      case 'RECHAZADOS':
        return 'RECHAZADOS'; // El backend ya soporta este filtro
      default:
        return filtro;
    }
  }

  // Método para seleccionar todas las sucursales
  onSeleccionarTodasSucursales(): void {
    this.sucursalesSeleccionadas = [...this.sucursales];
    this.configuracionForm.patchValue({
      sucursales: this.sucursalesSeleccionadas
    });
    this.updateFormControlsState(); // Actualizar estado de controles
    this.recargarItemsPorCambioSucursales();
  }

  // Método para deseleccionar todas las sucursales
  onDeseleccionarTodasSucursales(): void {
    this.sucursalesSeleccionadas = [];
    this.configuracionForm.patchValue({
      sucursales: []
    });
    this.updateFormControlsState(); // Actualizar estado de controles
    this.recargarItemsPorCambioSucursales();
  }

  /**
   * Actualiza las propiedades computadas de los ítems
   */
  private updateItemsComputedProperties(): void {
    this.items.forEach(item => {
      // Calcular cantidad esperada basada en las sucursales seleccionadas
      item.cantidadEsperadaComputed = this.calcularCantidadEsperada(item);
      
      // Calcular cantidades en unidades de presentación
      item.cantidadEsperadaEnPresentacionComputed = this.calcularCantidadEsperadaEnPresentacion(item);
      item.cantidadRecibidaEnPresentacionComputed = this.calcularCantidadRecibidaEnPresentacion(item);
      item.cantidadRechazadaEnPresentacionComputed = this.calcularCantidadRechazadaEnPresentacion(item);
      
      // Calcular si hay diferencia entre cantidad esperada y total
      item.mostrarCantidadTotalComputed = item.cantidadEnNota && 
                                         item.cantidadEsperadaComputed !== item.cantidadEnNota;
      
      // Calcular si el item está seleccionado
      (item as any).isSelectedComputed = this.isItemSelected(item);
    });
  }

  /**
   * Calcula la cantidad esperada para un ítem basada en las sucursales seleccionadas
   * @param item NotaRecepcionItem con sus distribuciones
   * @returns Cantidad esperada sumada de las sucursales seleccionadas
   */
  private calcularCantidadEsperada(item: any): number {
    if (!item.notaRecepcionItemDistribuciones || !this.sucursalesSeleccionadas.length) {
      return 0;
    }

    const sucursalesIds = this.sucursalesSeleccionadas.map(s => s.id);
    
    // Sumar cantidades de las distribuciones que corresponden a las sucursales seleccionadas
    const cantidadEsperada = item.notaRecepcionItemDistribuciones
      .filter((dist: any) => sucursalesIds.includes(dist.sucursalEntrega?.id))
      .reduce((sum: number, dist: any) => sum + (dist.cantidad || 0), 0);

    return cantidadEsperada;
  }

  /**
   * Calcula la cantidad esperada para un ítem basada en las sucursales seleccionadas
   * Versión auxiliar que puede usarse en contextos donde no se tiene acceso directo a this.sucursalesSeleccionadas
   * @param item NotaRecepcionItem con sus distribuciones
   * @returns Cantidad esperada sumada de las sucursales seleccionadas
   */
  private calcularCantidadEsperadaParaItem(item: any): number {
    return this.calcularCantidadEsperada(item);
  }

  /**
   * Calcula la cantidad esperada en unidades de presentación
   * @param item NotaRecepcionItem con sus distribuciones
   * @returns Cantidad esperada en unidades de presentación
   */
  private calcularCantidadEsperadaEnPresentacion(item: any): number {
    const cantidadEsperada = this.calcularCantidadEsperada(item);
    
    // Si no hay presentación, devolver la cantidad original
    if (!item.presentacionEnNota || !item.presentacionEnNota.cantidad) {
      return cantidadEsperada;
    }
    
    // Convertir a unidades de presentación
    return cantidadEsperada / item.presentacionEnNota.cantidad;
  }

  /**
   * Calcula la cantidad recibida en unidades de presentación
   * @param item NotaRecepcionItem
   * @returns Cantidad recibida en unidades de presentación
   */
  private calcularCantidadRecibidaEnPresentacion(item: any): number {
    // Si no hay presentación, devolver la cantidad original
    if (!item.presentacionEnNota || !item.presentacionEnNota.cantidad) {
      return item.cantidadRecibida || 0;
    }
    
    // Convertir a unidades de presentación
    return (item.cantidadRecibida || 0) / item.presentacionEnNota.cantidad;
  }

  /**
   * Calcula la cantidad rechazada en unidades de presentación
   * @param item NotaRecepcionItem
   * @returns Cantidad rechazada en unidades de presentación
   */
  private calcularCantidadRechazadaEnPresentacion(item: any): number {
    // Si no hay presentación, devolver la cantidad original
    if (!item.presentacionEnNota || !item.presentacionEnNota.cantidad) {
      return item.cantidadRechazada || 0;
    }
    
    // Convertir a unidades de presentación
    return (item.cantidadRechazada || 0) / item.presentacionEnNota.cantidad;
  }

  private loadNotasRecepcion(): void {
    this.loadingNotas = true;
    
    this.pedidoService.onGetNotaRecepcionPorPedidoId(this.pedidoId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (notas) => {
          this.notasRecepcion = notas;
            this.notasDataSource.data = this.notasRecepcion;
          this.loadingNotas = false;
          this.updateComputedProperties();
        },
        error: (error) => {
          console.error('Error cargando notas de recepción:', error);
          this.loadingNotas = false;
          // Mantener datos mock en caso de error
        }
      });
  }

  onVerificacionRapida(item: NotaRecepcionItem): void {
    console.log('Iniciando verificación rápida para item:', item);
    
    // Validaciones básicas
    if (!this.validarVerificacionRapida(item)) {
      return;
    }

    // Ejecutar verificación rápida
    this.ejecutarVerificacionRapida(item);
  }

  /**
   * Valida si se puede realizar verificación rápida
   */
  private validarVerificacionRapida(item: NotaRecepcionItem): boolean {
    // Verificar que el ítem esté pendiente o parcial (parcial permite continuar recibiendo)
    if (item.estadoRecepcion !== 'PENDIENTE' && item.estadoRecepcion !== 'PARCIAL') {
      this.notificacionService.openAlgoSalioMal('Este ítem ya fue verificado completamente');
      return false;
    }

    // Verificar que haya sucursales seleccionadas
    if (!this.sucursalesSeleccionadas.length) {
      this.notificacionService.openAlgoSalioMal('Debe seleccionar al menos una sucursal');
      return false;
    }

    // Verificar que el ítem tenga distribuciones válidas
    if (!item['notaRecepcionItemDistribuciones']?.length) {
      this.notificacionService.openAlgoSalioMal('No hay distribuciones válidas para este ítem');
      return false;
    }

    return true;
  }

  /**
   * Ejecuta la verificación rápida con recepción automática
   */
  private ejecutarVerificacionRapida(item: NotaRecepcionItem): void {
    console.log('Ejecutando verificación rápida...');

    // Si es la primera verificación, crear recepción automáticamente
    if (!this.isRecepcionCreada) {
      this.verificarPrimeraRecepcion();
    }

    // Para una sucursal: verificación directa
    if (this.sucursalesSeleccionadas.length === 1) {
      this.verificacionRapidaUnaSucursal(item);
    } else {
      // Para múltiples sucursales: abrir diálogo
      this.abrirDialogoVerificacionRapidaSucursales(item);
    }
  }

  /**
   * Verificación rápida para una sola sucursal
   */
  private verificacionRapidaUnaSucursal(item: NotaRecepcionItem): void {
    const sucursalSeleccionada = this.sucursalesSeleccionadas[0];
    
    // Buscar la distribución correspondiente para vincular correctamente
    this.pedidoService.onGetNotaRecepcionItemDistribucionesByNotaRecepcionItemId(item.id)
      .subscribe({
        next: (distribuciones) => {
          console.log('Distribuciones encontradas:', distribuciones);
          
          // Filtrar distribuciones que coincidan con la sucursal seleccionada
          const distribucionesFiltradas = distribuciones.filter(dist => 
            dist.sucursalEntrega?.id === sucursalSeleccionada.id
          );
          
          console.log('Distribuciones filtradas para sucursal:', distribucionesFiltradas.length);
          
          // Si hay múltiples distribuciones, crear un item por cada una
          if (distribucionesFiltradas.length > 1) {
            console.log('=== MÚLTIPLES DISTRIBUCIONES DETECTADAS ===');
            console.log('Creando un RecepcionMercaderiaItem por cada distribución');
            
            // Calcular cantidad pendiente si el estado es PARCIAL
            let cantidadPendienteTotal = item.cantidadEsperadaComputed || 0;
            
            if (item.estadoRecepcion === 'PARCIAL') {
              const cantidadEsperada = item.cantidadEsperadaComputed || 0;
              const cantidadRecibida = item.cantidadRecibida || 0;
              const cantidadRechazada = item.cantidadRechazada || 0;
              cantidadPendienteTotal = Math.max(0, cantidadEsperada - cantidadRecibida - cantidadRechazada);
              
              console.log('Estado PARCIAL detectado. Cantidad pendiente total:', cantidadPendienteTotal);
            }
            
            // Crear items para cada distribución
            const itemsToSave = distribucionesFiltradas.map(distribucion => {
              // Calcular cantidad a recibir para esta distribución
              // Si hay cantidad pendiente, distribuir proporcionalmente
              let cantidadARecibir = distribucion.cantidad;
              
              if (item.estadoRecepcion === 'PARCIAL' && cantidadPendienteTotal > 0) {
                // Distribuir la cantidad pendiente proporcionalmente
                const cantidadTotalDistribuciones = distribucionesFiltradas.reduce((sum, dist) => sum + dist.cantidad, 0);
                const proporcion = distribucion.cantidad / cantidadTotalDistribuciones;
                cantidadARecibir = Math.min(distribucion.cantidad, cantidadPendienteTotal * proporcion);
              }
              
              return {
                notaRecepcionItemId: item.id,
                notaRecepcionItemDistribucionId: distribucion.id,
                productoId: item.producto?.id,
                presentacionRecibidaId: item.presentacionEnNota?.id || null,
                sucursalEntregaId: sucursalSeleccionada.id,
                usuarioId: 1, // TODO: Obtener usuario actual del sistema de autenticación
                cantidadRecibida: cantidadARecibir,
                cantidadRechazada: 0,
                esBonificacion: item.esBonificacion || false
              };
            });
            
            console.log('Items a guardar:', itemsToSave);
            
            // Guardar todos los items en paralelo
            forkJoin(
              itemsToSave.map(itemInput => 
                this.pedidoService.onSaveRecepcionMercaderiaItem(itemInput)
              )
            ).subscribe({
              next: (results) => {
                console.log('Items guardados exitosamente:', results);
                
                // Si es la primera vez, obtener el ID de la recepción del primer resultado
                if (!this.isRecepcionCreada && results.length > 0 && results[0] && results[0].recepcionMercaderiaId) {
                  this.recepcionMercaderiaId = results[0].recepcionMercaderiaId;
                  this.isRecepcionCreada = true;
                  console.log('Recepción creada automáticamente con ID:', this.recepcionMercaderiaId);
                }

                // Actualizar UI
                this.actualizarUIItemVerificado(item);
                
                // Recargar pedido y etapa actual
                if (this.pedidoId) {
                  this.pedidoService.onGetPedidoById(this.pedidoId)
                    .pipe(untilDestroyed(this))
                    .subscribe({
                      next: (pedido) => {
                        this.pedido = pedido;
                        this.loadEtapaActual();
                      },
                      error: (error) => {
                        console.error('Error al recargar pedido:', error);
                        this.loadEtapaActual();
                      }
                    });
                } else {
                  this.loadEtapaActual();
                }
                
                this.notificacionService.openSucess(`${results.length} ítem(s) verificado(s) exitosamente`);
              },
              error: (error) => {
                console.error('Error al guardar items:', error);
                this.notificacionService.openAlgoSalioMal('Error al verificar ítem(es): ' + (error.message || 'Error desconocido'));
              }
            });
          } else {
            // Lógica original para una sola distribución
            const distribucionEncontrada = distribucionesFiltradas[0] || distribuciones.find(dist => 
              dist.sucursalEntrega?.id === sucursalSeleccionada.id
            );
            
            // Calcular cantidad a recibir
            // Si el estado es PARCIAL, calcular la cantidad pendiente
            // Si el estado es PENDIENTE, usar la cantidad esperada completa
            let cantidadARecibir = item.cantidadEsperadaComputed || 0;
            
            if (item.estadoRecepcion === 'PARCIAL') {
              // Calcular cantidad pendiente
              const cantidadEsperada = item.cantidadEsperadaComputed || 0;
              const cantidadRecibida = item.cantidadRecibida || 0;
              const cantidadRechazada = item.cantidadRechazada || 0;
              const cantidadPendiente = cantidadEsperada - cantidadRecibida - cantidadRechazada;
              
              // Usar la cantidad pendiente en lugar de la esperada completa
              cantidadARecibir = Math.max(0, cantidadPendiente);
              
              console.log('Estado PARCIAL detectado. Calculando cantidad pendiente:', {
                cantidadEsperada,
                cantidadRecibida,
                cantidadRechazada,
                cantidadPendiente,
                cantidadARecibir
              });
            }
            
            // Crear input para guardar
            const itemInput: any = {
              notaRecepcionItemId: item.id,
              productoId: item.producto?.id,
              presentacionRecibidaId: item.presentacionEnNota?.id || null,
              sucursalEntregaId: sucursalSeleccionada.id,
              usuarioId: 1, // TODO: Obtener usuario actual del sistema de autenticación
              cantidadRecibida: cantidadARecibir,
              cantidadRechazada: 0,
              esBonificacion: item.esBonificacion || false
            };
            
            // Si se encontró la distribución, incluir su ID para vinculación directa
            if (distribucionEncontrada) {
              itemInput.notaRecepcionItemDistribucionId = distribucionEncontrada.id;
              console.log('=== DISTRIBUCIÓN ENCONTRADA PARA VINCULACIÓN ===');
              console.log('Distribución ID:', distribucionEncontrada.id);
              console.log('Sucursal:', distribucionEncontrada.sucursalEntrega?.nombre);
              console.log('Cantidad en distribución:', distribucionEncontrada.cantidad);
            } else {
              console.log('=== ADVERTENCIA: No se encontró distribución para la sucursal ===');
              console.log('Sucursal seleccionada:', sucursalSeleccionada.nombre);
              console.log('Distribuciones disponibles:', distribuciones.length);
            }

            console.log('Guardando item de recepción:', itemInput);

            // Guardar en backend (esto creará la recepción automáticamente si es la primera)
            this.pedidoService.onSaveRecepcionMercaderiaItem(itemInput)
              .subscribe({
                next: (result) => {
                  console.log('Item guardado exitosamente:', result);
                  
                  // Si es la primera vez, obtener el ID de la recepción
                  if (!this.isRecepcionCreada && result && result.recepcionMercaderiaId) {
                    this.recepcionMercaderiaId = result.recepcionMercaderiaId;
                    this.isRecepcionCreada = true;
                    console.log('Recepción creada automáticamente con ID:', this.recepcionMercaderiaId);
                  }

                  // Actualizar UI
                  this.actualizarUIItemVerificado(item);
                  
                  // Recargar pedido primero para obtener las etapas actualizadas
                  // Luego recargar etapa actual para actualizar el estado del botón "Finalizar Recepción Física"
                  // Esto es necesario porque el backend cambia la etapa a EN_PROCESO cuando se crea el primer item
                  if (this.pedidoId) {
                    this.pedidoService.onGetPedidoById(this.pedidoId)
                      .pipe(untilDestroyed(this))
                      .subscribe({
                        next: (pedido) => {
                          this.pedido = pedido;
                          // Después de recargar el pedido, cargar la etapa actual
                          // Esto asegura que tenemos las etapas actualizadas
                          this.loadEtapaActual();
                        },
                        error: (error) => {
                          console.error('Error al recargar pedido:', error);
                          // Intentar cargar etapa actual aunque falle la recarga del pedido
                          this.loadEtapaActual();
                        }
                      });
                  } else {
                    // Si no hay pedidoId, solo cargar etapa actual
                    this.loadEtapaActual();
                  }
                  
                  this.notificacionService.openSucess('Ítem verificado exitosamente');
                },
                error: (error) => {
                  console.error('Error al guardar item:', error);
                  this.notificacionService.openAlgoSalioMal('Error al verificar ítem: ' + (error.message || 'Error desconocido'));
                }
              });
          }
        },
        error: (error) => {
          console.error('Error al obtener distribuciones:', error);
          this.notificacionService.openAlgoSalioMal('Error al obtener distribuciones del ítem');
        }
      });
  }

  /**
   * Actualiza la UI después de verificar un ítem
   */
  private actualizarUIItemVerificado(item: NotaRecepcionItem): void {
    // Actualizar estado del ítem
    item.estadoRecepcion = 'VERIFICADO';
    item.cantidadRecibida = item.cantidadEsperadaComputed || 0;
    item.cantidadRechazada = 0;

    // Marcar como recién verificado
    this.marcarItemRecienVerificado(item.id);

    // Actualizar propiedades computadas
    this.updateItemsComputedProperties();
  }

  /**
   * Actualiza la UI después de verificar un ítem con verificación detallada
   */
  private actualizarUIItemVerificadoDetallado(item: NotaRecepcionItem, result: any): void {
    // Calcular cantidad total recibida de todas las distribuciones
    const cantidadTotalRecibida = result.distribuciones.reduce((total: number, dist: any) => {
      return total + dist.cantidadRecibida;
    }, 0);

    // Actualizar estado del ítem
    item.estadoRecepcion = 'VERIFICADO';
    item.cantidadRecibida = cantidadTotalRecibida;
    item.cantidadRechazada = 0;

    // Marcar como recién verificado
    this.marcarItemRecienVerificado(item.id);

    // Actualizar propiedades computadas
    this.updateItemsComputedProperties();
    
    console.log('UI actualizada para verificación detallada:', {
      itemId: item.id,
      cantidadTotalRecibida,
      distribuciones: result.distribuciones.length
    });
  }

  /**
   * Marca un item como recién verificado y programa su ocultamiento
   */
  private marcarItemRecienVerificado(itemId: number): void {
    // Limpiar timeout anterior si existe
    if (this.timeoutsVerificacion.has(itemId)) {
      clearTimeout(this.timeoutsVerificacion.get(itemId));
    }

    // Agregar a la lista de items recién verificados
    this.itemsRecienVerificados.add(itemId);
    
    // Iniciar parpadeo
    this.iniciarParpadeo(itemId);

    // Programar ocultamiento después de 5 segundos
    const timeout = setTimeout(() => {
      this.itemsRecienVerificados.delete(itemId);
      this.timeoutsVerificacion.delete(itemId);
      this.detenerParpadeo(itemId);
      
      // Remover el item localmente si el filtro actual es 'PENDIENTES'
      // En lugar de recargar toda la lista desde el backend
      if (this.filtroVerificacion() === 'PENDIENTES') {
        this.removerItemLocalmente(itemId);
      }
    }, 5000);

    this.timeoutsVerificacion.set(itemId, timeout);
  }

  /**
   * Remueve un item de la lista localmente sin recargar desde el backend
   * Actualiza el dataSource, el total de elementos y las propiedades computadas
   */
  private removerItemLocalmente(itemId: number): void {
    // Buscar el índice del item en la lista local
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      // El item no está en la lista actual (puede estar en otra página)
      // No hacer nada, ya que no afecta la visualización actual
      console.log(`Item ${itemId} no encontrado en la lista actual, puede estar en otra página`);
      return;
    }

    // Remover el item de la lista local
    this.items.splice(itemIndex, 1);
    
    // Actualizar el total de elementos (decrementar en 1)
    this.itemsTotalElements = Math.max(0, this.itemsTotalElements - 1);
    
    // Aplicar filtro actual a los items restantes
    const itemsFiltrados = this.items.filter(item => this.debeMostrarItem(item));
    
    // Actualizar el dataSource con los items filtrados
    this.itemsDataSource.data = itemsFiltrados;
    
    // Actualizar propiedades computadas solo para los items restantes
    this.updateItemsComputedProperties();
    
    console.log(`Item ${itemId} removido localmente de la lista. Total restante: ${this.items.length}`);
  }

  /**
   * Inicia el parpadeo del icono de cancelar verificación
   */
  private iniciarParpadeo(itemId: number): void {
    this.itemsParpadeando.add(itemId);
  }

  /**
   * Detiene el parpadeo del icono
   */
  private detenerParpadeo(itemId: number): void {
    this.itemsParpadeando.delete(itemId);
  }

  /**
   * Refresca la tabla de items aplicando el filtro actual
   */
  private refrescarTablaItems(): void {
    if (this.items.length > 0) {
      const itemsFiltrados = this.items.filter(item => this.debeMostrarItem(item));
      this.itemsDataSource.data = itemsFiltrados;
    }
  }

  /**
   * Maneja el cambio en el filtro de texto
   */
  onFiltroTextoChange(): void {
    // Enviar al Subject para debouncing
    this.filtroTextoSubject$.next(this.filtroTexto);
  }

  /**
   * Ejecuta la búsqueda con filtro de texto (llamado después del debounce)
   */
  private ejecutarBusquedaConFiltroTexto(): void {
    // No ejecutar si está en carga inicial
    if (this.isInitialNotaLoad) {
      return;
    }
    
    // Solo ejecutar si hay filtro de texto y nota seleccionada
    if (!this.filtroTexto || this.filtroTexto.trim() === '' || !this.notaSeleccionada) {
      return;
    }
    
    // Reset a primera página cuando cambia el filtro de texto
    this.itemsPageIndex = 0;
    
    // Recargar datos del backend
    this.loadItemsNotaRecepcion(this.notaSeleccionada.id);
  }

  /**
   * Limpia el filtro de texto
   */
  limpiarFiltroTexto(): void {
    this.filtroTexto = '';
    // No enviar al Subject para evitar recarga innecesaria
  }

  /**
   * Fuerza la habilitación de controles (para debugging)
   */
  forzarHabilitacionControles(): void {
    this.configuracionForm.get('filtroVerificacion')?.enable();
    this.configuracionForm.get('mostrarSucursalesAlVerificar')?.enable();
  }

  /**
   * Verifica si un item debe ser visible basado en el filtro y estado de verificación reciente
   */
  private debeMostrarItem(item: NotaRecepcionItem): boolean {
    const filtro = this.filtroVerificacion();
    const esRecienVerificado = this.itemsRecienVerificados.has(item.id);
    
    // Si es recién verificado, siempre mostrarlo
    if (esRecienVerificado) {
      return true;
    }
    
    // Aplicar filtro de texto (código de barras y nombre del producto)
    if (this.filtroTexto && this.filtroTexto.trim() !== '') {
      const textoBusqueda = this.filtroTexto.toLowerCase().trim();
      const codigoProducto = item.producto?.codigoPrincipal?.toLowerCase() || '';
      const nombreProducto = item.producto?.descripcion?.toLowerCase() || '';
      
      const coincideCodigo = codigoProducto.includes(textoBusqueda);
      const coincideNombre = nombreProducto.includes(textoBusqueda);
      
      if (!coincideCodigo && !coincideNombre) {
        return false;
      }
    }
    
    // Aplicar filtro normal
    switch (filtro) {
      case 'PENDIENTES':
        // Incluir items pendientes Y items parciales/rechazados que tengan cantidad pendiente
        if (item.estadoRecepcion === 'PENDIENTE') {
          return true;
        }
        
        // Verificar si tiene cantidad pendiente (estado PARCIAL o RECHAZADO con cantidad pendiente > 0)
        if (item.estadoRecepcion === 'PARCIAL' || item.estadoRecepcion === 'RECHAZADO') {
          const cantidadEsperada = this.calcularCantidadEsperada(item);
          const cantidadRecibida = item.cantidadRecibida || 0;
          const cantidadRechazada = item.cantidadRechazada || 0;
          const cantidadPendiente = cantidadEsperada - cantidadRecibida - cantidadRechazada;
          
          // Si hay cantidad pendiente, mostrarlo en el filtro de pendientes
          return cantidadPendiente > 0.001; // Tolerancia para punto flotante
        }
        
        return false;
      case 'VERIFICADOS':
        return item.estadoRecepcion === 'VERIFICADO';
      case 'RECHAZADOS':
        // Incluir items completamente rechazados (sin cantidad pendiente)
        if (item.estadoRecepcion === 'RECHAZADO') {
          const cantidadEsperada = this.calcularCantidadEsperada(item);
          const cantidadRecibida = item.cantidadRecibida || 0;
          const cantidadRechazada = item.cantidadRechazada || 0;
          const cantidadPendiente = cantidadEsperada - cantidadRecibida - cantidadRechazada;
          
          // Solo mostrar si no hay cantidad pendiente (rechazo completo)
          return cantidadPendiente <= 0.001; // Tolerancia para punto flotante
        }
        return false;
      case 'TODOS':
        return true;
      default:
        return true;
    }
  }

  /**
   * Verifica si un item debe ser visible basado en el estado de verificación reciente
   */
  private debeMostrarItemRecienVerificado(item: NotaRecepcionItem): boolean {
    return this.itemsRecienVerificados.has(item.id);
  }

  /**
   * Verifica si es la primera recepción y crea la entidad si es necesario
   */
  private verificarPrimeraRecepcion(): void {
    console.log('Verificando primera recepción...');
    
    // Por ahora, solo marcar que se va a crear
    // El backend se encargará de crear la recepción automáticamente
    this.isRecepcionCreada = false;
  }

  onVerificacionDetallada(item: NotaRecepcionItem): void {
    this.abrirDialogoVerificacionDetallada(item);
  }

  onRechazarItem(item: NotaRecepcionItem): void {
    this.abrirDialogoRechazo(item);
  }

  onCancelarVerificacion(item: NotaRecepcionItem): void {
    console.log('Deshaciendo verificación para item:', item);
    
    // Usar diálogo genérico del sistema
    this.dialogosService.confirm(
      'Deshacer Verificación',
      '¿Está seguro que desea deshacer la verificación de este ítem?',
      'Esta acción no se puede deshacer.',
      undefined,
      true,
      'Deshacer',
      'No'
    ).subscribe(result => {
      if (result) {
      this.ejecutarCancelacionVerificacion(item);
    }
    });
  }

  onCancelarRechazo(item: NotaRecepcionItem): void {
    console.log('Deshaciendo rechazo para item:', item);
    
    // Usar diálogo genérico del sistema
    this.dialogosService.confirm(
      'Deshacer Rechazo',
      '¿Está seguro que desea deshacer el rechazo de este ítem?',
      'Esta acción no se puede deshacer.',
      undefined,
      true,
      'Deshacer',
      'No'
    ).subscribe(result => {
      if (result) {
      this.ejecutarCancelacionRechazo(item);
    }
    });
  }

  /**
   * Ejecuta la cancelación de verificación
   */
  private ejecutarCancelacionVerificacion(item: NotaRecepcionItem): void {
    console.log('Ejecutando deshacer verificación...');

    // Validar que tenemos sucursales seleccionadas
    if (this.sucursalesSeleccionadas.length === 0) {
      this.notificacionService.openAlgoSalioMal('Debe seleccionar al menos una sucursal');
      return;
    }

    // Para cada sucursal seleccionada, cancelar la verificación
    const cancelaciones = this.sucursalesSeleccionadas.map(sucursal => 
      this.pedidoService.onCancelarVerificacion(item.id, sucursal.id).toPromise()
    );

    // Ejecutar todas las cancelaciones
    Promise.all(cancelaciones).then(results => {
      const exitosas = results.filter(result => result === true).length;
      const total = results.length;
      
      if (exitosas === total) {
        // Todas las cancelaciones fueron exitosas
        this.actualizarUIItemCancelado(item);
        this.notificacionService.openSucess(`Verificación deshecha exitosamente en ${exitosas} sucursal(es)`);
      } else if (exitosas > 0) {
        // Algunas cancelaciones fueron exitosas
        this.actualizarUIItemCancelado(item);
        this.notificacionService.openSucess(`Verificación deshecha parcialmente: ${exitosas}/${total} sucursales`);
      } else {
        // Ninguna cancelación fue exitosa
        this.notificacionService.openAlgoSalioMal('No se pudo deshacer la verificación en ninguna sucursal');
      }
    }).catch(error => {
      console.error('Error al deshacer verificación:', error);
      this.notificacionService.openAlgoSalioMal('Error al deshacer verificación: ' + error.message);
    });
  }

  /**
   * Ejecuta la cancelación de rechazo
   */
  private ejecutarCancelacionRechazo(item: NotaRecepcionItem): void {
    console.log('Ejecutando deshacer rechazo...');

    // Validar que tenemos sucursales seleccionadas
    if (this.sucursalesSeleccionadas.length === 0) {
      this.notificacionService.openAlgoSalioMal('Debe seleccionar al menos una sucursal');
      return;
    }

    // Para cada sucursal seleccionada, cancelar el rechazo
    const cancelaciones = this.sucursalesSeleccionadas.map(sucursal => 
      this.pedidoService.onCancelarRechazo(item.id, sucursal.id).toPromise()
    );

    // Ejecutar todas las cancelaciones
    Promise.all(cancelaciones).then(results => {
      const exitosas = results.filter(result => result === true).length;
      const total = results.length;
      
      if (exitosas === total) {
        // Todas las cancelaciones fueron exitosas
        this.actualizarUIItemRechazoCancelado(item);
        this.notificacionService.openSucess(`Rechazo deshecho exitosamente en ${exitosas} sucursal(es)`);
      } else if (exitosas > 0) {
        // Algunas cancelaciones fueron exitosas
        this.actualizarUIItemRechazoCancelado(item);
        this.notificacionService.openSucess(`Rechazo deshecho parcialmente: ${exitosas}/${total} sucursales`);
      } else {
        // Ninguna cancelación fue exitosa
        this.notificacionService.openAlgoSalioMal('No se pudo deshacer el rechazo en ninguna sucursal');
      }
    }).catch(error => {
      console.error('Error al deshacer rechazo:', error);
      this.notificacionService.openAlgoSalioMal('Error al deshacer rechazo: ' + error.message);
    });
  }

  /**
   * Actualiza la UI después de cancelar la verificación de un ítem
   */
  private actualizarUIItemCancelado(item: NotaRecepcionItem): void {
    // Actualizar estado del ítem
    item.estadoRecepcion = 'PENDIENTE';
    item.cantidadRecibida = 0;
    item.cantidadRechazada = 0;
    // No tenemos recepcionMercaderiaId en NotaRecepcionItem, se maneja en el backend

    // Actualizar propiedades computadas
    this.updateItemsComputedProperties();
  }

  /**
   * Actualiza la UI después de cancelar el rechazo de un ítem
   */
  private actualizarUIItemRechazoCancelado(item: NotaRecepcionItem): void {
    // Recargar el ítem desde el backend para obtener el estado y cantidades actualizados
    // El backend calcula los totales sumando todos los RecepcionMercaderiaItem relacionados
    // Esto asegura que el estado sea correcto después de cancelar el rechazo
    if (this.notaSeleccionada) {
      // Recargar items de la nota para obtener datos actualizados
      setTimeout(() => {
        this.loadItemsNotaRecepcion(this.notaSeleccionada!.id);
      }, 500);
    } else {
      // Si no hay nota seleccionada, actualizar localmente (no debería ocurrir)
      // Calcular estado basándose en las cantidades actuales
      const cantidadEsperada = this.calcularCantidadEsperada(item);
      const cantidadRecibida = item.cantidadRecibida || 0;
      const cantidadRechazada = item.cantidadRechazada || 0;
      
      // Determinar el nuevo estado
      const nuevoEstado = this.determinarEstadoRecepcion(
        cantidadEsperada,
        cantidadRecibida,
        cantidadRechazada
      );
      
      item.estadoRecepcion = nuevoEstado;
      
      // Actualizar propiedades computadas
      this.updateItemsComputedProperties();
    }
  }

  private abrirDialogoVerificacionRapidaSucursales(item: NotaRecepcionItem): void {
    const dialogRef = this.dialog.open(VerificacionRapidaSucursalesDialogComponent, {
      width: '800px',
      data: {
        item: item,
        sucursalesSeleccionadas: this.sucursalesSeleccionadas
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Procesar verificación rápida con múltiples sucursales
        this.procesarVerificacionRapidaSucursales(item, result);
      }
    });
  }

  private abrirDialogoVerificacionDetallada(item: NotaRecepcionItem): void {
    // TODO: Obtener distribuciones reales del backend
    // Por ahora, crear distribuciones simuladas basadas en las sucursales seleccionadas
    const distribucionesSimuladas: NotaRecepcionItemDistribucion[] = this.sucursalesSeleccionadas.map(sucursal => {
      const distribucion = new NotaRecepcionItemDistribucion();
      distribucion.id = 0;
      distribucion.notaRecepcionItem = item;
      distribucion.sucursalInfluencia = null; // Puede ser null según el modelo Java
      distribucion.sucursalEntrega = sucursal;
      distribucion.cantidad = item.cantidadEnNota / this.sucursalesSeleccionadas.length;
      distribucion.creadoEn = new Date();
      distribucion.usuario = null; // Puede ser null según el modelo Java
      return distribucion;
    });

    // El diálogo ahora cargará las presentaciones del producto automáticamente
    const presentacionesDisponibles: any[] = []; // Se cargarán en el diálogo

    const dialogRef = this.dialog.open(RecepcionMercaderiaVerificarItemDialogComponent, {
      width: '60%',
      height: '60%',
      data: {
        item: item,
        distribuciones: distribucionesSimuladas,
        sucursalesSeleccionadas: this.sucursalesSeleccionadas,
        presentacionesDisponibles: presentacionesDisponibles
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Procesar verificación detallada
        this.procesarVerificacionDetallada(item, result);
      }
    });
  }

  private abrirDialogoRechazo(item: NotaRecepcionItem): void {
    // Obtener las distribuciones del item y filtrar por sucursales seleccionadas
    this.pedidoService.onGetNotaRecepcionItemDistribucionesByNotaRecepcionItemId(item.id)
      .subscribe({
        next: (distribuciones) => {
          console.log('Distribuciones del item:', distribuciones);
          
          // Filtrar distribuciones por sucursales seleccionadas
          const sucursalesIds = this.sucursalesSeleccionadas.map(s => s.id);
          const distribucionesFiltradas = distribuciones.filter(dist => 
            sucursalesIds.includes(dist.sucursalEntrega?.id)
          );
          
          console.log('Distribuciones filtradas por sucursales seleccionadas:', distribucionesFiltradas);
          
          // NO agrupar distribuciones - pasar las distribuciones originales al diálogo
          // Esto permite que el diálogo maneje correctamente la distribución proporcional de rechazos
          // cuando hay múltiples distribuciones con la misma sucursal de entrega pero diferente influencia
          console.log('Usando distribuciones originales (sin agrupar) para permitir distribución proporcional de rechazos');
          
          // Abrir diálogo con las distribuciones originales
          const dialogRef = this.dialog.open(RecepcionMercaderiaRechazarItemDialogComponent, {
            width: '1100px',
            height: '85vh',
            data: {
              item: item,
              distribuciones: distribucionesFiltradas, // Usar distribuciones originales, no agrupadas
              sucursalesSeleccionadas: this.sucursalesSeleccionadas,
              presentacionesDisponibles: [] // Se cargarán en el diálogo
            } as RecepcionMercaderiaRechazarItemDialogData,
            disableClose: true
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              // Procesar rechazo
              this.procesarRechazo(item, result);
            }
          });
        },
        error: (error) => {
          console.error('Error al obtener distribuciones para rechazo:', error);
          this.notificacionService.openAlgoSalioMal('Error al obtener distribuciones del ítem');
        }
      });
  }

  /**
   * Agrupa las distribuciones por sucursal de entrega, sumando las cantidades
   * @param distribuciones Lista de distribuciones a agrupar
   * @returns Lista de distribuciones agrupadas por sucursal
   */
  private agruparDistribucionesPorSucursal(distribuciones: any[]): any[] {
    const distribucionesAgrupadas = new Map<number, any>();
    
    distribuciones.forEach(dist => {
      const sucursalId = dist.sucursalEntrega?.id;
      
      if (!sucursalId) {
        console.warn('Distribución sin sucursal de entrega:', dist);
        return;
      }
      
      if (distribucionesAgrupadas.has(sucursalId)) {
        // Ya existe una distribución para esta sucursal, sumar cantidades
        const distribucionExistente = distribucionesAgrupadas.get(sucursalId);
        distribucionExistente.cantidad += dist.cantidad;
        
        console.log(`Agrupando distribución para sucursal ${dist.sucursalEntrega.nombre}:`, {
          cantidadOriginal: dist.cantidad,
          cantidadAcumulada: distribucionExistente.cantidad
        });
      } else {
        // Primera distribución para esta sucursal
        distribucionesAgrupadas.set(sucursalId, {
          ...dist,
          // Mantener la referencia original para posibles usos futuros
          distribucionesOriginales: [dist]
        });
        
        console.log(`Nueva distribución agrupada para sucursal ${dist.sucursalEntrega.nombre}:`, {
          cantidad: dist.cantidad
        });
      }
    });
    
    // Convertir Map a Array
    const resultado = Array.from(distribucionesAgrupadas.values());
    
    console.log('Resultado de agrupación:', resultado.map(d => ({
      sucursal: d.sucursalEntrega.nombre,
      cantidadTotal: d.cantidad,
      distribucionesOriginales: d.distribucionesOriginales?.length || 1
    })));
    
    return resultado;
  }

  private procesarVerificacionRapidaSucursales(item: NotaRecepcionItem, result: any): void {
    // TODO: Implementar lógica de backend para verificación rápida con múltiples sucursales
    console.log('Verificación rápida con múltiples sucursales:', result);
    
    // Actualizar estado local
    item.cantidadRecibida = result.cantidadTotalRecibida;
    item.estadoRecepcion = 'VERIFICADO';
    
    // Verificar si es la primera verificación
    this.verificarPrimeraRecepcion();
    
    this.updateComputedProperties();
  }

  private procesarVerificacionDetallada(item: NotaRecepcionItem, result: any): void {
    console.log('Procesando verificación detallada:', result);
    
    // Validar datos del diálogo
    if (!result || !result.distribuciones || result.distribuciones.length === 0) {
      this.notificacionService.openAlgoSalioMal('Datos de verificación inválidos');
      return;
    }

    // Obtener distribuciones del backend para vincular correctamente
    this.pedidoService.onGetNotaRecepcionItemDistribucionesByNotaRecepcionItemId(item.id)
      .subscribe({
        next: (distribucionesBackend) => {
          console.log('Distribuciones del backend:', distribucionesBackend);
          
          // Crear promesas para cada distribución del diálogo
          const promesas = result.distribuciones.map((distDialogo: any) => {
            // Buscar la distribución correspondiente en el backend
            const distribucionBackend = distribucionesBackend.find(dist => 
              dist.sucursalEntrega?.id === distDialogo.sucursalId
            );
            
            // Crear input para guardar usando el mismo patrón que verificación rápida
            const itemInput: any = {
              notaRecepcionItemId: item.id,
              productoId: item.producto?.id,
              presentacionRecibidaId: result.presentacionId || item.presentacionEnNota?.id,
              sucursalEntregaId: distDialogo.sucursalId,
              usuarioId: 1, // TODO: Obtener usuario actual del sistema de autenticación
              cantidadRecibida: distDialogo.cantidadRecibida, // Ya convertido a unidades base por el diálogo
              cantidadRechazada: 0,
              esBonificacion: item.esBonificacion || false
            };
            
            // Si se encontró la distribución, incluir su ID para vinculación directa
            if (distribucionBackend) {
              itemInput.notaRecepcionItemDistribucionId = distribucionBackend.id;
              console.log('=== DISTRIBUCIÓN ENCONTRADA PARA VINCULACIÓN ===');
              console.log('Distribución ID:', distribucionBackend.id);
              console.log('Sucursal:', distribucionBackend.sucursalEntrega?.nombre);
              console.log('Cantidad en distribución:', distribucionBackend.cantidad);
            } else {
              console.log('=== ADVERTENCIA: No se encontró distribución para la sucursal ===');
              console.log('Sucursal ID:', distDialogo.sucursalId);
              console.log('Distribuciones disponibles:', distribucionesBackend.length);
            }

            console.log('Guardando item de recepción detallada:', itemInput);

            // Usar el mismo método que verificación rápida
            return this.pedidoService.onSaveRecepcionMercaderiaItem(itemInput).toPromise();
          });

          // Ejecutar todas las verificaciones
          Promise.all(promesas)
            .then((results) => {
              console.log('Todas las verificaciones detalladas completadas:', results);
              
              // Si es la primera vez, obtener el ID de la recepción del primer resultado
              if (!this.isRecepcionCreada && results.length > 0 && results[0] && results[0].recepcionMercaderiaId) {
                this.recepcionMercaderiaId = results[0].recepcionMercaderiaId;
                this.isRecepcionCreada = true;
                console.log('Recepción creada automáticamente con ID:', this.recepcionMercaderiaId);
              }

              // Actualizar UI del item
              this.actualizarUIItemVerificadoDetallado(item, result);
              
              // Notificar éxito
              this.notificacionService.openSucess('Verificación detallada completada exitosamente');
              
              // NO recargar datos automáticamente - la visibilidad se maneja localmente
              // El item permanecerá visible por 5 segundos gracias a itemsRecienVerificados
            })
            .catch((error) => {
              console.error('Error en verificación detallada:', error);
              this.notificacionService.openAlgoSalioMal('Error al guardar verificación detallada: ' + (error.message || 'Error desconocido'));
            });
        },
        error: (error) => {
          console.error('Error al obtener distribuciones para verificación detallada:', error);
          this.notificacionService.openAlgoSalioMal('Error al obtener distribuciones del ítem');
        }
      });
  }

  private procesarRechazo(item: NotaRecepcionItem, result: any): void {
    console.log('Procesando rechazo de item:', result);
    
    // Validar datos del diálogo
    if (!result || !result.rechazos || result.rechazos.length === 0) {
      this.notificacionService.openAlgoSalioMal('Datos de rechazo inválidos');
      return;
    }

    // Preparar datos para el backend
    const rechazarItemInput = {
      notaRecepcionItemId: item.id,
      presentacionId: result.presentacionId,
      rechazos: result.rechazos.map((rechazo: any) => ({
        sucursalId: rechazo.sucursalId,
        notaRecepcionItemDistribucionId: rechazo.notaRecepcionItemDistribucionId, // Incluir ID de distribución
        cantidadRechazada: rechazo.cantidadRechazada,
        motivoRechazo: rechazo.motivoRechazo,
        observaciones: rechazo.observaciones || ''
      })),
      usuarioId: 1 // TODO: Obtener usuario actual del sistema de autenticación
    };

    console.log('Enviando rechazo al backend:', rechazarItemInput);

    // Llamar al servicio de backend
    this.pedidoService.onRechazarItem(rechazarItemInput)
      .subscribe({
        next: (response) => {
          console.log('Rechazo procesado exitosamente:', response);
          
          // Calcular cantidad total rechazada en este rechazo (suma de todos los rechazos del diálogo)
          const cantidadRechazadaEnEsteRechazo = result.rechazos.reduce((total: number, rechazo: any) => {
            return total + rechazo.cantidadRechazada;
          }, 0);

          // Obtener cantidades actuales del item
          const cantidadRecibidaActual = item.cantidadRecibida || 0;
          const cantidadRechazadaAnterior = item.cantidadRechazada || 0;
          
          // Calcular cantidad esperada basada en las sucursales seleccionadas
          const cantidadEsperada = this.calcularCantidadEsperada(item);
          
          // Calcular nueva cantidad rechazada total (anterior + nueva)
          const cantidadRechazadaNueva = cantidadRechazadaAnterior + cantidadRechazadaEnEsteRechazo;
          
          // Calcular cantidad pendiente después del rechazo
          const cantidadPendiente = cantidadEsperada - cantidadRecibidaActual - cantidadRechazadaNueva;
          
          // Si hay cantidad pendiente después del rechazo parcial, marcarla automáticamente como recibida
          if (cantidadPendiente > 0.001 && cantidadRechazadaNueva < cantidadEsperada) {
            console.log('Rechazo parcial detectado. Marcando cantidad restante como recibida automáticamente...');
            this.procesarRecepcionAutomaticaRestante(item, result, cantidadPendiente, cantidadEsperada);
          } else {
            // Rechazo completo o sin cantidad pendiente, solo actualizar UI
            this.actualizarUIDespuesRechazo(item, cantidadRechazadaNueva, cantidadRecibidaActual, cantidadEsperada, cantidadPendiente);
          }
        },
        error: (error) => {
          console.error('Error al procesar rechazo:', error);
          this.notificacionService.openAlgoSalioMal('Error al registrar rechazo: ' + (error.message || 'Error desconocido'));
        }
      });
  }

  /**
   * Procesa automáticamente la recepción de la cantidad restante después de un rechazo parcial
   * @param item Item que fue rechazado parcialmente
   * @param result Resultado del diálogo de rechazo
   * @param cantidadPendiente Cantidad pendiente que debe ser recibida automáticamente
   * @param cantidadEsperada Cantidad esperada total del ítem
   */
  private procesarRecepcionAutomaticaRestante(
    item: NotaRecepcionItem,
    result: any,
    cantidadPendiente: number,
    cantidadEsperada: number
  ): void {
    console.log('Procesando recepción automática de cantidad restante:', {
      itemId: item.id,
      cantidadPendiente,
      cantidadEsperada
    });

    // Obtener distribuciones del backend para calcular la cantidad restante por sucursal
    this.pedidoService.onGetNotaRecepcionItemDistribucionesByNotaRecepcionItemId(item.id)
      .subscribe({
        next: (distribucionesBackend) => {
          console.log('Distribuciones del backend para recepción automática:', distribucionesBackend);

          // Crear un mapa de rechazos por distribución (notaRecepcionItemDistribucionId) para calcular la cantidad restante
          // Esto es crítico cuando hay múltiples distribuciones con la misma sucursal pero diferentes cantidades
          const rechazosPorDistribucion = new Map<number, number>();
          result.rechazos.forEach((rechazo: any) => {
            if (rechazo.notaRecepcionItemDistribucionId) {
              const cantidadActual = rechazosPorDistribucion.get(rechazo.notaRecepcionItemDistribucionId) || 0;
              rechazosPorDistribucion.set(rechazo.notaRecepcionItemDistribucionId, cantidadActual + rechazo.cantidadRechazada);
            }
          });

          // Crear promesas para recibir automáticamente la cantidad restante en cada distribución
          const promesasRecepcion: Promise<any>[] = [];

          distribucionesBackend.forEach((distribucion: any) => {
            const distribucionId = distribucion.id;
            const sucursalId = distribucion.sucursalEntrega?.id;
            if (!sucursalId || !distribucionId) return;

            const cantidadEsperadaDistribucion = distribucion.cantidad || 0;
            // Obtener el rechazo específico de esta distribución, no de toda la sucursal
            const cantidadRechazadaDistribucion = rechazosPorDistribucion.get(distribucionId) || 0;
            const cantidadRestanteDistribucion = cantidadEsperadaDistribucion - cantidadRechazadaDistribucion;

            // Si hay cantidad restante en esta distribución, crear recepción automática
            if (cantidadRestanteDistribucion > 0.001) {
              console.log(`Creando recepción automática para distribución ${distribucionId} (sucursal ${sucursalId}):`, {
                cantidadEsperada: cantidadEsperadaDistribucion,
                cantidadRechazada: cantidadRechazadaDistribucion,
                cantidadRestante: cantidadRestanteDistribucion
              });

              const itemInput: any = {
                notaRecepcionItemId: item.id,
                productoId: item.producto?.id,
                presentacionRecibidaId: result.presentacionId || item.presentacionEnNota?.id,
                sucursalEntregaId: sucursalId,
                usuarioId: 1, // TODO: Obtener usuario actual del sistema de autenticación
                cantidadRecibida: cantidadRestanteDistribucion, // Cantidad restante automáticamente recibida para esta distribución específica
                cantidadRechazada: 0,
                esBonificacion: item.esBonificacion || false,
                notaRecepcionItemDistribucionId: distribucionId // Siempre incluir el ID de distribución
              };

              promesasRecepcion.push(
                this.pedidoService.onSaveRecepcionMercaderiaItem(itemInput).toPromise()
              );
            }
          });

          // Ejecutar todas las recepciones automáticas
          if (promesasRecepcion.length > 0) {
            Promise.all(promesasRecepcion)
              .then((results) => {
                console.log('Recepciones automáticas completadas:', results);

                // Si es la primera vez, obtener el ID de la recepción del primer resultado
                if (!this.isRecepcionCreada && results.length > 0 && results[0] && results[0].recepcionMercaderiaId) {
                  this.recepcionMercaderiaId = results[0].recepcionMercaderiaId;
                  this.isRecepcionCreada = true;
                  console.log('Recepción creada automáticamente con ID:', this.recepcionMercaderiaId);
                }

                // Actualizar UI del item
                const cantidadRechazadaAnterior = item.cantidadRechazada || 0;
                const cantidadRechazadaEnEsteRechazo = result.rechazos.reduce((total: number, rechazo: any) => {
                  return total + rechazo.cantidadRechazada;
                }, 0);
                const cantidadRechazadaNueva = cantidadRechazadaAnterior + cantidadRechazadaEnEsteRechazo;
                const cantidadRecibidaActual = item.cantidadRecibida || 0;
                const cantidadRecibidaNueva = cantidadRecibidaActual + cantidadPendiente;

                // Esperar más tiempo antes de recargar para asegurar que el backend haya procesado todo
                // El backend necesita tiempo para calcular correctamente el estado cuando hay rechazo + recepción
                // Aumentar el tiempo de espera a 3 segundos para dar más tiempo al backend de procesar todas las recepciones automáticas
                setTimeout(() => {
                  this.actualizarUIDespuesRechazo(
                    item,
                    cantidadRechazadaNueva,
                    cantidadRecibidaNueva,
                    cantidadEsperada,
                    0, // No hay cantidad pendiente, todo fue procesado
                    true // Indicar que se debe recargar desde el backend
                  );
                }, 3000); // Esperar 3 segundos para que el backend procese todo y calcule el estado correctamente

                // Notificar éxito
                this.notificacionService.openSucess(
                  `Rechazo parcial registrado. La cantidad restante (${cantidadPendiente.toFixed(2)} unidades) fue automáticamente marcada como recibida.`
                );
              })
              .catch((error) => {
                console.error('Error en recepción automática:', error);
                this.notificacionService.openAlgoSalioMal(
                  'Rechazo registrado, pero hubo un error al marcar la cantidad restante como recibida: ' + 
                  (error.message || 'Error desconocido')
                );
                
                // Aún así actualizar UI con el rechazo
                const cantidadRechazadaAnterior = item.cantidadRechazada || 0;
                const cantidadRechazadaEnEsteRechazo = result.rechazos.reduce((total: number, rechazo: any) => {
                  return total + rechazo.cantidadRechazada;
                }, 0);
                const cantidadRechazadaNueva = cantidadRechazadaAnterior + cantidadRechazadaEnEsteRechazo;
                const cantidadRecibidaActual = item.cantidadRecibida || 0;

                this.actualizarUIDespuesRechazo(
                  item,
                  cantidadRechazadaNueva,
                  cantidadRecibidaActual,
                  cantidadEsperada,
                  cantidadPendiente
                );
              });
          } else {
            // No hay recepciones automáticas que crear (no debería ocurrir si cantidadPendiente > 0)
            console.warn('No se encontraron distribuciones para crear recepción automática');
            const cantidadRechazadaAnterior = item.cantidadRechazada || 0;
            const cantidadRechazadaEnEsteRechazo = result.rechazos.reduce((total: number, rechazo: any) => {
              return total + rechazo.cantidadRechazada;
            }, 0);
            const cantidadRechazadaNueva = cantidadRechazadaAnterior + cantidadRechazadaEnEsteRechazo;
            const cantidadRecibidaActual = item.cantidadRecibida || 0;

            this.actualizarUIDespuesRechazo(
              item,
              cantidadRechazadaNueva,
              cantidadRecibidaActual,
              cantidadEsperada,
              cantidadPendiente
            );
          }
        },
        error: (error) => {
          console.error('Error al obtener distribuciones para recepción automática:', error);
          this.notificacionService.openAlgoSalioMal(
            'Rechazo registrado, pero hubo un error al obtener distribuciones para marcar la cantidad restante como recibida.'
          );
          
          // Aún así actualizar UI con el rechazo
          const cantidadRechazadaAnterior = item.cantidadRechazada || 0;
          const cantidadRechazadaEnEsteRechazo = result.rechazos.reduce((total: number, rechazo: any) => {
            return total + rechazo.cantidadRechazada;
          }, 0);
          const cantidadRechazadaNueva = cantidadRechazadaAnterior + cantidadRechazadaEnEsteRechazo;
          const cantidadRecibidaActual = item.cantidadRecibida || 0;

          this.actualizarUIDespuesRechazo(
            item,
            cantidadRechazadaNueva,
            cantidadRecibidaActual,
            cantidadEsperada,
            cantidadPendiente
          );
        }
      });
  }

  /**
   * Actualiza la UI después de procesar un rechazo
   * @param item Item que fue rechazado
   * @param cantidadRechazadaNueva Nueva cantidad rechazada total
   * @param cantidadRecibidaNueva Nueva cantidad recibida total
   * @param cantidadEsperada Cantidad esperada total
   * @param cantidadPendiente Cantidad pendiente restante
   * @param recargarDesdeBackend Si debe recargar desde el backend (por defecto true)
   */
  private actualizarUIDespuesRechazo(
    item: NotaRecepcionItem,
    cantidadRechazadaNueva: number,
    cantidadRecibidaNueva: number,
    cantidadEsperada: number,
    cantidadPendiente: number,
    recargarDesdeBackend: boolean = true
  ): void {
    // Actualizar cantidades del item localmente (temporal hasta recargar desde backend)
    item.cantidadRechazada = cantidadRechazadaNueva;
    item.cantidadRecibida = cantidadRecibidaNueva;

    // Determinar el estado basándose en las cantidades
    const nuevoEstado = this.determinarEstadoRecepcion(
      cantidadEsperada,
      cantidadRecibidaNueva,
      cantidadRechazadaNueva
    );

    item.estadoRecepcion = nuevoEstado;

    // Determinar mensaje según el tipo de rechazo
    const esRechazoCompleto = cantidadRechazadaNueva >= cantidadEsperada;
    let mensaje = '';

    if (esRechazoCompleto) {
      mensaje = 'Rechazo completo registrado exitosamente. El ítem está completamente rechazado.';
    } else if (cantidadPendiente <= 0.001) {
      // No hay cantidad pendiente, todo fue procesado (rechazo + recepción automática)
      mensaje = 'Rechazo parcial registrado. La cantidad restante fue automáticamente marcada como recibida.';
    } else {
      mensaje = `Rechazo parcial registrado exitosamente. Cantidad pendiente: ${cantidadPendiente.toFixed(2)} unidades.`;
    }

    // Notificar éxito con mensaje descriptivo
    if (mensaje) {
      this.notificacionService.openSucess(mensaje);
    }

    // Actualizar propiedades computadas
    this.updateComputedProperties();

    // Recargar el ítem desde el backend para obtener el estado y cantidades actualizados
    // El backend calcula los totales sumando todos los RecepcionMercaderiaItem relacionados
    // Esto asegura que el estado calculado en el backend sea el que se muestre
    if (recargarDesdeBackend && this.notaSeleccionada) {
      // Esperar más tiempo si hay recepción automática para dar tiempo al backend de procesar todo
      // El backend necesita tiempo adicional para calcular correctamente el estado cuando hay rechazo + recepción
      // Aumentar el tiempo de espera cuando no hay cantidad pendiente (todo fue procesado) para asegurar que el estado se calcule correctamente
      const tiempoEspera = cantidadPendiente <= 0.001 ? 3500 : 500;
      setTimeout(() => {
        this.loadItemsNotaRecepcion(this.notaSeleccionada!.id);
      }, tiempoEspera);
    }

    console.log('Rechazo procesado:', {
      itemId: item.id,
      cantidadEsperada,
      cantidadRecibida: cantidadRecibidaNueva,
      cantidadRechazada: cantidadRechazadaNueva,
      cantidadPendiente,
      estado: nuevoEstado,
      esRechazoCompleto
    });
  }

  /**
   * Determina el estado de recepción basándose en las cantidades
   * @param cantidadEsperada Cantidad esperada del ítem
   * @param cantidadRecibida Cantidad recibida del ítem
   * @param cantidadRechazada Cantidad rechazada del ítem
   * @returns Estado de recepción: 'PENDIENTE', 'VERIFICADO', 'RECHAZADO', 'PARCIAL'
   */
  private determinarEstadoRecepcion(
    cantidadEsperada: number,
    cantidadRecibida: number,
    cantidadRechazada: number
  ): 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO' | 'PARCIAL' {
    // Validar que cantidadEsperada sea válida
    if (!cantidadEsperada || cantidadEsperada <= 0) {
      return 'PENDIENTE';
    }

    // Si no se ha procesado nada
    if (cantidadRecibida === 0 && cantidadRechazada === 0) {
      return 'PENDIENTE';
    }

    // Calcular cantidad pendiente
    const cantidadPendiente = cantidadEsperada - cantidadRecibida - cantidadRechazada;
    
    // Tolerancia para comparaciones de punto flotante
    const TOLERANCIA = 0.001;

    // Caso 1: Rechazo completo - toda la cantidad esperada fue rechazada
    if (cantidadRechazada >= cantidadEsperada - TOLERANCIA) {
      return 'RECHAZADO';
    }

    // Caso 2: La suma de recibido + rechazado cubre toda la cantidad esperada
    if (Math.abs((cantidadRecibida + cantidadRechazada) - cantidadEsperada) < TOLERANCIA) {
      // Si hay cantidad recibida, está verificado (aunque haya rechazo)
      if (cantidadRecibida > 0) {
        return 'VERIFICADO';
      } else {
        // Solo rechazo, completamente rechazado
        return 'RECHAZADO';
      }
    }

    // Caso 3: Hay cantidad pendiente (recepción/rechazo parcial)
    if (cantidadPendiente > TOLERANCIA) {
      // Si hay rechazo, el estado es PARCIAL (indica que hay cantidad pendiente)
      // El backend puede determinar si es PARCIAL o RECHAZADO según su lógica
      // Por ahora, usamos PARCIAL para indicar que hay cantidad pendiente
      if (cantidadRechazada > 0) {
        // Hay rechazo parcial, pero también puede haber recepción parcial
        // El estado PARCIAL indica que hay cantidad pendiente
        return 'PARCIAL';
      } else if (cantidadRecibida > 0) {
        // Solo recepción parcial, hay cantidad pendiente
        return 'PARCIAL';
      }
    }

    // Caso 4: Si no hay cantidad pendiente pero las cantidades no suman exactamente
    // (puede ser por redondeo o error de cálculo)
    if (Math.abs(cantidadPendiente) < TOLERANCIA) {
      if (cantidadRecibida > 0) {
        return 'VERIFICADO';
      } else if (cantidadRechazada > 0) {
        return 'RECHAZADO';
      }
    }

    // Caso edge: no debería ocurrir
    return 'PENDIENTE';
  }

  // Paginación
  onNotasPageChange(event: PageEvent): void {
    this.notasPageSize = event.pageSize;
    this.notasPageIndex = event.pageIndex;
    this.loadNotasRecepcion();
  }

  onItemsPageChange(event: PageEvent): void {
    this.itemsPageIndex = event.pageIndex;
    this.itemsPageSize = event.pageSize;
    
    // Recargar items si hay una nota seleccionada
    if (this.notaSeleccionada) {
      this.loadItemsNotaRecepcion(this.notaSeleccionada.id);
    }
  }

  onMostrarSucursalesChange(): void {
    // console.log('Mostrar sucursales al verificar cambiado a:', this.configuracionForm.get('mostrarSucursalesAlVerificar')?.value);
    // this.updateComputedProperties();
  }

  // Métodos auxiliares para UI
  getEstadoChipClass(estado: string, item?: NotaRecepcionItem): string {
    // Si el estado es RECHAZADO y hay item, verificar si es completo o parcial
    if (estado === 'RECHAZADO' && item) {
      const cantidadEsperada = this.calcularCantidadEsperada(item);
      const cantidadRechazada = item.cantidadRechazada || 0;
      const cantidadRecibida = item.cantidadRecibida || 0;
      const cantidadPendiente = cantidadEsperada - cantidadRecibida - cantidadRechazada;
      const TOLERANCIA = 0.001;
      
      // Si es rechazo completo, usar clase de rechazado (rojo)
      if (cantidadPendiente <= TOLERANCIA || cantidadRechazada >= cantidadEsperada - TOLERANCIA) {
        return 'estado-rechazado';
      } else {
        // Rechazo parcial, usar clase parcial (naranja/azul)
        return 'estado-parcial';
      }
    }
    
    // Para otros estados, usar la clase estándar
    switch (estado) {
      case 'PENDIENTE':
        return 'estado-pendiente';
      case 'VERIFICADO':
        return 'estado-verificado';
      case 'RECHAZADO':
        return 'estado-rechazado';
      case 'PARCIAL':
        return 'estado-parcial';
      default:
        return 'estado-pendiente';
    }
  }

  getEstadoText(estado: string, item?: NotaRecepcionItem): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'PENDIENTE';
      case 'VERIFICADO':
        return 'VERIFICADO';
      case 'RECHAZADO':
        // Si hay item, verificar si es rechazo completo o parcial
        if (item) {
          const cantidadEsperada = this.calcularCantidadEsperada(item);
          const cantidadRechazada = item.cantidadRechazada || 0;
          const cantidadRecibida = item.cantidadRecibida || 0;
          const cantidadPendiente = cantidadEsperada - cantidadRecibida - cantidadRechazada;
          const TOLERANCIA = 0.001;
          
          // Si es rechazo completo (no hay cantidad pendiente o la rechazada >= esperada)
          if (cantidadPendiente <= TOLERANCIA || cantidadRechazada >= cantidadEsperada - TOLERANCIA) {
            return 'RECHAZADO COMPLETO';
          } else if (cantidadRechazada > 0) {
            // Rechazo parcial (hay cantidad pendiente)
            return 'RECHAZADO PARCIAL';
          }
        }
        return 'RECHAZADO';
      case 'PARCIAL':
        // Si hay item, verificar si es recepción parcial o rechazo parcial
        if (item) {
          const cantidadRechazada = item.cantidadRechazada || 0;
          const cantidadRecibida = item.cantidadRecibida || 0;
          
          if (cantidadRechazada > 0 && cantidadRecibida > 0) {
            return 'PARCIAL (RECEPCIÓN + RECHAZO)';
          } else if (cantidadRechazada > 0) {
            return 'PARCIAL (RECHAZO)';
          } else if (cantidadRecibida > 0) {
            return 'PARCIAL (RECEPCIÓN)';
          }
        }
        return 'PARCIAL';
      default:
        return 'PENDIENTE';
    }
  }

  getNotaEstadoChipClass(estado: string): string {
    switch (estado) {
      case 'CONCILIADO':
        return 'estado-verificado'; // Usar verde como en Recepción Documental
      case 'PENDIENTE':
        return 'estado-pendiente';
      case 'RECHAZADO':
        return 'estado-rechazado';
      default:
        return 'estado-pendiente';
    }
  }

  // Método para obtener el nombre de una sucursal por su ID
  getSucursalNombre(sucursalId: number): string {
    const sucursal = this.sucursales.find(s => s.id === sucursalId);
    return sucursal ? sucursal.nombre : 'Sucursal no encontrada';
  }

  onModoVisualizacionChange(): void {
  //  TODO: Implementar lógica para cambiar el modo de visualización
  }

  onSucursalesChange(): void {
    // TODO: Implementar lógica para cambiar las sucursales
  }

  /**
   * Valida y finaliza la recepción física
   */
  async validarYFinalizarRecepcion(): Promise<void> {
    if (this.sucursalesSeleccionadas.length === 0) {
      this.notificacionService.openAlgoSalioMal('Debe seleccionar al menos una sucursal');
      return;
    }

    this.loading = true;
    
    try {
      const sucursalesIds = this.sucursalesSeleccionadas.map(s => s.id);
      
      // Validar antes de finalizar
      const validacion = await this.pedidoService.onValidarFinalizacionRecepcionPorPedido(
        this.pedidoId, 
        sucursalesIds
      ).toPromise();
      
      if (!validacion.puedeFinalizar) {
        this.mostrarDialogoItemsPendientes(validacion.itemsPendientes);
        return;
      }
      
      // Confirmar y finalizar todas las recepciones del pedido
      const confirmar = await this.dialogosService.confirm(
        'Finalizar Recepción Física',
        '¿Está seguro que desea finalizar la recepción física?'
      ).toPromise();
      
      if (confirmar) {
        // Finalizar recepción física
        await this.pedidoService.onFinalizarRecepcionFisicaPorPedido(this.pedidoId, sucursalesIds).toPromise();
        
        // 1. Mostrar notificación de éxito
        this.notificacionService.openSucess('Recepción física finalizada exitosamente');
        
        // 2. Recargar datos para reflejar cambios
        this.loadNotasRecepcion();
        this.loadEtapaActual();
        
        // 3. Limpiar estados del componente
        this.loading = false;
        // No limpiar sucursalesSeleccionadas ni notaSeleccionada para mantener contexto
        // Solo limpiar items si no hay nota seleccionada
        if (!this.notaSeleccionada) {
          this.items = [];
          this.itemsDataSource.data = [];
        }
        
        // 4. Actualizar propiedades computadas
        this.updateComputedProperties();
        
        // 5. Verificar si todas las recepciones están finalizadas para marcar como finalizada
        // Esto se hace verificando si la etapa cambió a COMPLETADA
        // Por ahora, solo marcamos si la etapa está completada
        if (this.etapaEstadoComputed === ProcesoEtapaEstado.COMPLETADA) {
          this.recepcionFinalizadaComputed = true;
        }
        
        // 6. Emitir evento para notificar al componente padre
        this.recepcionFinalizada.emit();
        
        // 7. Mostrar mensaje informativo si la etapa está completada
        if (this.etapaEstadoComputed === ProcesoEtapaEstado.COMPLETADA) {
          this.notificacionService.openSucess('Recepción física completada. Puede proceder a la etapa de Solicitud de Pago.');
        }
      }
      
    } catch (error) {
      console.error('Error al validar finalización:', error);
      this.notificacionService.openAlgoSalioMal('Error al validar finalización: ' + error.message);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Muestra diálogo con items pendientes
   */
  /**
   * Muestra un diálogo con los items pendientes de forma estructurada
   */
  private mostrarDialogoItemsPendientes(itemsPendientes: any[]): void {
    const mensajePrincipal = `No se puede finalizar la recepción física. Hay ${itemsPendientes.length} ítem(s) pendiente(s) de verificar:`;
    
    // Formatear cada item pendiente con información detallada
    const listaItems: string[] = itemsPendientes.map((item, index) => {
      const diferencia = (item.cantidadEsperada || 0) - ((item.cantidadRecibida || 0) + (item.cantidadRechazada || 0));
      return `${index + 1}. ${item.descripcionProducto} (Nota: ${item.numeroNota})\n   ` +
             `Esperado: ${item.cantidadEsperada || 0} | ` +
             `Recibido: ${item.cantidadRecibida || 0} | ` +
             `Rechazado: ${item.cantidadRechazada || 0} | ` +
             `Pendiente: ${diferencia}`;
    });
    
    this.dialogosService.confirm(
      'Ítems Pendientes de Verificación',
      mensajePrincipal,
      undefined, // message2
      listaItems,
      false, // action: false para mostrar solo botón "Cerrar"
      'Cerrar',
      undefined
    ).subscribe();
  }

  /**
   * Carga la etapa actual del proceso para validar si se puede finalizar
   */
  private loadEtapaActual(): void {
    if (!this.pedidoId) {
      console.warn('No hay pedidoId para cargar etapa actual');
      return;
    }

    // Usar el servicio para obtener la etapa actual
    this.procesoEtapaService.onGetEtapaActual(this.pedidoId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (etapa) => {
          console.log('Etapa actual cargada:', etapa);
          this.etapaActualComputed = etapa;
          
          // Si tenemos el pedido, buscar el estado de la etapa RECEPCION_MERCADERIA
          if (this.pedido && this.pedido.procesoEtapas) {
            const etapaRecepcionMercaderia = this.pedido.procesoEtapas.find(
              e => e.tipoEtapa === ProcesoEtapaTipo.RECEPCION_MERCADERIA
            );
            this.etapaEstadoComputed = etapaRecepcionMercaderia?.estadoEtapa || null;
            console.log('Estado de etapa RECEPCION_MERCADERIA:', this.etapaEstadoComputed);
          }
          
          this.updateComputedProperties();
        },
        error: (error) => {
          console.error('Error cargando etapa actual:', error);
          this.etapaActualComputed = null;
          this.etapaEstadoComputed = null;
          this.updateComputedProperties();
        }
      });
  }

  // ===== MÉTODOS PARA SELECCIÓN Y RECEPCIÓN DE ITEMS =====

  /**
   * Maneja el toggle de selección de un item individual
   */
  onToggleItemSelection(item: NotaRecepcionItem, isSelected: boolean): void {
    // Si se selecciona/deselecciona un item individual, desactivar "seleccionar todos"
    this.selectAllItems = false;
    
    if (isSelected) {
      if (!this.selectedItems.includes(item)) {
        this.selectedItems.push(item);
      }
    } else {
      const index = this.selectedItems.indexOf(item);
      if (index > -1) {
        this.selectedItems.splice(index, 1);
      }
    }
    this.updateComputedProperties();
  }

  /**
   * Maneja el toggle de selección de todos los items
   */
  onToggleAllItemsSelection(isSelected: boolean): void {
    if (isSelected) {
      // Seleccionar todos los items de la página actual
      this.selectedItems = [...this.itemsDataSource.data];
      // Activar bandera para indicar que se marcó "select all"
      this.selectAllItems = true;
    } else {
      // Desactivar bandera y limpiar selección
      this.selectAllItems = false;
      this.selectedItems = [];
    }
    this.updateComputedProperties();
  }

  /**
   * Verifica si un item está seleccionado
   */
  isItemSelected(item: NotaRecepcionItem): boolean {
    return this.selectedItems.includes(item);
  }

  /**
   * Detecta los estados de los items y retorna un resumen
   */
  private detectarEstadosItems(items: NotaRecepcionItem[]): { pendientes: number, parciales: number, verificados: number, rechazados: number } {
    const estados = {
      pendientes: 0,
      parciales: 0,
      verificados: 0,
      rechazados: 0
    };

    items.forEach(item => {
      const estado = item.estadoRecepcion;
      if (estado === 'PENDIENTE') {
        estados.pendientes++;
      } else if (estado === 'PARCIAL') {
        estados.parciales++;
      } else if (estado === 'VERIFICADO') {
        estados.verificados++;
      } else if (estado === 'RECHAZADO') {
        estados.rechazados++;
      }
    });

    return estados;
  }

  /**
   * Detecta si hay selección mixta (items verificados y pendientes/parciales seleccionados simultáneamente)
   */
  private detectarSeleccionMixta(): boolean {
    if (this.selectedItems.length === 0) {
      return false;
    }

    const tieneVerificados = this.selectedItems.some(item => item.estadoRecepcion === 'VERIFICADO');
    const tienePendientesOParciales = this.selectedItems.some(item => 
      item.estadoRecepcion === 'PENDIENTE' || item.estadoRecepcion === 'PARCIAL'
    );

    return tieneVerificados && tienePendientesOParciales;
  }

  /**
   * Verifica si todos los items visibles están verificados
   */
  private todosItemsEstanVerificados(): boolean {
    const itemsVisibles = this.itemsDataSource.data;
    if (itemsVisibles.length === 0) {
      return false;
    }

    return itemsVisibles.every(item => item.estadoRecepcion === 'VERIFICADO');
  }

  /**
   * Verifica si hay items pendientes o parciales en los items visibles
   */
  private tieneItemsPendientesOparciales(): boolean {
    const itemsVisibles = this.itemsDataSource.data;
    return itemsVisibles.some(item => 
      item.estadoRecepcion === 'PENDIENTE' || item.estadoRecepcion === 'PARCIAL'
    );
  }

  /**
   * Maneja el botón "Recepcionar todo"
   * Abre un diálogo de confirmación antes de recepcionar todos los items
   */
  onRecepcionarTodo(): void {
    if (!this.notaSeleccionada) {
      this.notificacionService.openWarn('Debe seleccionar una nota de recepción');
      return;
    }

    // Obtener TODOS los items de la nota (ignorar filtro actual)
    // Usar el servicio para obtener todos los items sin filtro de estado
    const sucursalesIds = this.sucursalesSeleccionadas.map(s => s.id);
    
    if (sucursalesIds.length === 0) {
      this.notificacionService.openWarn('Debe seleccionar al menos una sucursal');
      return;
    }

    // Obtener todos los items de la nota (filtro 'TODOS' para ignorar el filtro de verificación)
    this.pedidoService.onGetNotaRecepcionItemListPorNotaRecepcionIdYSucursales(
      this.notaSeleccionada.id,
      sucursalesIds,
      0, // Primera página
      9999, // Tamaño grande para obtener todos
      'TODOS', // Filtro 'TODOS' para obtener todos los items independientemente del estado
      '' // Sin filtro de texto
    ).subscribe({
      next: (pageInfo) => {
        if (!pageInfo || !pageInfo.getContent || pageInfo.getContent.length === 0) {
          this.notificacionService.openWarn('No hay items para recepcionar');
          return;
        }

        // Filtrar solo items con estado PENDIENTE o PARCIAL (recepcionables)
        const itemsRecepcionables = pageInfo.getContent.filter((item: any) => 
          item.estadoRecepcion === 'PENDIENTE' || item.estadoRecepcion === 'PARCIAL'
        );

        if (itemsRecepcionables.length === 0) {
          this.notificacionService.openWarn('No hay items pendientes o parciales para recepcionar');
          return;
        }

        // Mostrar diálogo de confirmación
        this.dialogosService.confirm(
          'Recepcionar Todos los Items',
          `Se recepcionarán automáticamente ${itemsRecepcionables.length} item(s) pendiente(s) o parcial(es). Asegúrese de que todas las informaciones estén correctas antes de continuar.`,
          'Esta acción marcará todos los items pendientes/parciales como recepcionados con las cantidades esperadas.',
          undefined,
          true, // action: true para mostrar botones de acción
          'Recepcionar Todo',
          'Cancelar'
        ).subscribe(confirmed => {
          if (confirmed) {
            this.ejecutarRecepcionTodo(itemsRecepcionables);
          }
        });
      },
      error: (error) => {
        console.error('Error al obtener items de la nota:', error);
        this.notificacionService.openAlgoSalioMal('Error al obtener los items de la nota');
      }
    });
  }

  /**
   * Maneja el botón "Recepcionar Selección"
   * Abre un diálogo de confirmación antes de recepcionar los items seleccionados
   */
  onRecepcionarSeleccion(): void {
    if (this.selectedItems.length === 0 && !this.selectAllItems) {
      this.notificacionService.openWarn('Debe seleccionar al menos un item para recepcionar');
      return;
    }

    // Validar que NO haya selección mixta
    if (this.tieneSeleccionMixtaComputed) {
      this.notificacionService.openWarn('No se puede recepcionar una selección mixta. Por favor, seleccione solo items pendientes/parciales o solo items verificados.');
      return;
    }

    // Determinar items a recepcionar
    let itemsARecepcionar: NotaRecepcionItem[];
    
    if (this.selectAllItems) {
      // Si se seleccionaron todos, usar los items visibles
      itemsARecepcionar = this.itemsDataSource.data;
    } else {
      // Usar los items seleccionados
      itemsARecepcionar = this.selectedItems;
    }

    // Filtrar solo items recepcionables (PENDIENTE o PARCIAL)
    const itemsRecepcionables = itemsARecepcionar.filter(item => 
      item.estadoRecepcion === 'PENDIENTE' || item.estadoRecepcion === 'PARCIAL'
    );

    if (itemsRecepcionables.length === 0) {
      this.notificacionService.openWarn('Los items seleccionados no son recepcionables. Solo se pueden recepcionar items con estado PENDIENTE o PARCIAL.');
      return;
    }

    // Si hay items verificados en la selección, mostrar advertencia
    const itemsVerificados = itemsARecepcionar.filter(item => item.estadoRecepcion === 'VERIFICADO');
    if (itemsVerificados.length > 0) {
      this.notificacionService.openWarn('Algunos items seleccionados ya están verificados y no serán recepcionados nuevamente.');
    }

    // Determinar el mensaje según la cantidad de items recepcionables
    const mensaje = `Se recepcionarán automáticamente ${itemsRecepcionables.length} item(s) seleccionado(s). Asegúrese de que todas las informaciones estén correctas antes de continuar.`;

    // Mostrar diálogo de confirmación
    this.dialogosService.confirm(
      'Recepcionar Items Seleccionados',
      mensaje,
      'Esta acción marcará los items seleccionados como recepcionados con las cantidades esperadas.',
      undefined,
      true, // action: true para mostrar botones de acción
      'Recepcionar Selección',
      'Cancelar'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.ejecutarRecepcionSeleccion(itemsRecepcionables);
      }
    });
  }

  /**
   * Ejecuta la recepción automática de todos los items recepcionables de la nota
   */
  private ejecutarRecepcionTodo(itemsRecepcionables: NotaRecepcionItem[]): void {
    if (!this.notaSeleccionada) {
      this.notificacionService.openWarn('Debe seleccionar una nota de recepción');
      return;
    }

    const sucursalesIds = this.sucursalesSeleccionadas.map(s => s.id);
    if (sucursalesIds.length === 0) {
      this.notificacionService.openWarn('Debe seleccionar al menos una sucursal');
      return;
    }

    this.loading = true;
    console.log(`Iniciando recepción masiva de la nota ${this.notaSeleccionada.id} para sucursales ${sucursalesIds}`);

    // Llamar al nuevo método masivo del backend
    this.pedidoService.onRecepcionarTodoPorNota(
      this.notaSeleccionada.id,
      sucursalesIds,
      1 // TODO: Obtener usuario actual
    ).subscribe({
      next: (success) => {
        console.log('Recepción masiva completada:', success);

        // Recargar datos
        if (this.notaSeleccionada) {
          setTimeout(() => {
            this.loadItemsNotaRecepcion(this.notaSeleccionada!.id);
          }, 500);
        }

        // Recargar pedido y etapa
        if (this.pedidoId) {
          this.pedidoService.onGetPedidoById(this.pedidoId)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (pedido) => {
                this.pedido = pedido;
                this.loadEtapaActual();
              },
              error: () => this.loadEtapaActual()
            });
        } else {
          this.loadEtapaActual();
        }

        this.loading = false;
        this.notificacionService.openSucess('Todos los ítems pendientes han sido recepcionados exitosamente');
      },
      error: (error) => {
        console.error('Error en recepción masiva:', error);
        this.loading = false;
        this.notificacionService.openAlgoSalioMal('Error al recepcionar todos los ítems: ' + (error.message || 'Error desconocido'));
      }
    });
  }

  /**
   * Ejecuta la recepción automática de los items seleccionados
   */
  private ejecutarRecepcionSeleccion(itemsRecepcionables: NotaRecepcionItem[]): void {
    if (itemsRecepcionables.length === 0) {
      this.notificacionService.openWarn('No hay items para recepcionar');
      return;
    }

    if (!this.notaSeleccionada) {
      this.notificacionService.openWarn('Debe seleccionar una nota de recepción');
      return;
    }

    const sucursalesIds = this.sucursalesSeleccionadas.map(s => s.id);
    if (sucursalesIds.length === 0) {
      this.notificacionService.openWarn('Debe seleccionar al menos una sucursal');
      return;
    }

    this.loading = true;
    console.log(`Iniciando recepción masiva de ${itemsRecepcionables.length} item(s) seleccionados para sucursales ${sucursalesIds}`);

    const itemIds = itemsRecepcionables.map(item => item.id);

    // Llamar al método masivo del backend pasando los itemIds seleccionados
    this.pedidoService.onRecepcionarTodoPorNota(
      this.notaSeleccionada.id,
      sucursalesIds,
      1, // TODO: Obtener usuario actual
      itemIds
    ).subscribe({
      next: (success) => {
        console.log('Recepción masiva de selección completada:', success);

        // Limpiar selección
        this.selectedItems = [];
        this.selectAllItems = false;

        // Recargar datos
        if (this.notaSeleccionada) {
          setTimeout(() => {
            this.loadItemsNotaRecepcion(this.notaSeleccionada!.id);
          }, 500);
        }

        // Recargar pedido y etapa
        if (this.pedidoId) {
          this.pedidoService.onGetPedidoById(this.pedidoId)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (pedido) => {
                this.pedido = pedido;
                this.loadEtapaActual();
              },
              error: () => this.loadEtapaActual()
            });
        } else {
          this.loadEtapaActual();
        }

        this.loading = false;
        this.notificacionService.openSucess(`${itemsRecepcionables.length} ítem(s) seleccionado(s) han sido recepcionado(s) exitosamente`);
      },
      error: (error) => {
        console.error('Error en recepción masiva de selección:', error);
        this.loading = false;
        this.notificacionService.openAlgoSalioMal('Error al recepcionar los ítems seleccionados: ' + (error.message || 'Error desconocido'));
      }
    });
  }

  /**
   * Maneja el botón "Deshacer Verificación Todo"
   * Cancela la verificación de todos los items verificados de la nota
   */
  onDeshacerVerificacionTodo(): void {
    if (!this.notaSeleccionada) {
      this.notificacionService.openWarn('Debe seleccionar una nota de recepción');
      return;
    }

    // Obtener todos los items verificados de la nota
    const itemsVerificados = this.itemsDataSource.data.filter(item => 
      item.estadoRecepcion === 'VERIFICADO'
    );

    if (itemsVerificados.length === 0) {
      this.notificacionService.openWarn('No hay items verificados para deshacer');
      return;
    }

    // Mostrar diálogo de confirmación
    this.dialogosService.confirm(
      'Deshacer Verificación de Todos los Items',
      `Se cancelará la verificación de ${itemsVerificados.length} item(s) verificado(s). Esta acción no se puede deshacer.`,
      'Todos los items verificados volverán al estado PENDIENTE.',
      undefined,
      true, // action: true para mostrar botones de acción
      'Deshacer Verificación',
      'Cancelar'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.ejecutarDeshacerVerificacionTodo(itemsVerificados);
      }
    });
  }

  /**
   * Ejecuta la cancelación de verificación para todos los items verificados
   */
  private ejecutarDeshacerVerificacionTodo(itemsVerificados: NotaRecepcionItem[]): void {
    console.log('Ejecutando deshacer verificación de todos los items...');

    // Validar que tenemos sucursales seleccionadas
    if (this.sucursalesSeleccionadas.length === 0) {
      this.notificacionService.openAlgoSalioMal('Debe seleccionar al menos una sucursal');
      return;
    }

    // Crear array de promesas para cancelar verificación de todos los items
    const cancelaciones: Promise<boolean>[] = [];

    itemsVerificados.forEach(item => {
      this.sucursalesSeleccionadas.forEach(sucursal => {
        cancelaciones.push(
          this.pedidoService.onCancelarVerificacion(item.id, sucursal.id).toPromise()
        );
      });
    });

    // Ejecutar todas las cancelaciones
    Promise.all(cancelaciones).then(results => {
      const exitosas = results.filter(result => result === true).length;
      const total = results.length;
      
      if (exitosas === total) {
        // Todas las cancelaciones fueron exitosas
        this.notificacionService.openSucess(
          `Verificación cancelada exitosamente para ${itemsVerificados.length} item(s) en ${this.sucursalesSeleccionadas.length} sucursal(es)`
        );
        
        // Recargar items después de un breve delay para que el backend procese
        if (this.notaSeleccionada) {
          setTimeout(() => {
            this.loadItemsNotaRecepcion(this.notaSeleccionada!.id);
          }, 500);
        }
      } else if (exitosas > 0) {
        // Algunas cancelaciones fueron exitosas
        this.notificacionService.openSucess(
          `Verificación cancelada parcialmente: ${exitosas}/${total} operaciones exitosas`
        );
        
        // Recargar items después de un breve delay
        if (this.notaSeleccionada) {
          setTimeout(() => {
            this.loadItemsNotaRecepcion(this.notaSeleccionada!.id);
          }, 500);
        }
      } else {
        // Ninguna cancelación fue exitosa
        this.notificacionService.openAlgoSalioMal('No se pudo cancelar la verificación de ningún item');
      }
    }).catch(error => {
      console.error('Error al deshacer verificación:', error);
      this.notificacionService.openAlgoSalioMal('Error al deshacer verificación: ' + error.message);
    });
  }

  /**
   * Maneja el botón "Deshacer Selección"
   * Cancela la verificación de los items seleccionados
   */
  onDeshacerSeleccion(): void {
    if (this.selectedItems.length === 0) {
      this.notificacionService.openWarn('Debe seleccionar al menos un item para deshacer verificación');
      return;
    }

    // Filtrar solo items verificados
    const itemsVerificados = this.selectedItems.filter(item => 
      item.estadoRecepcion === 'VERIFICADO'
    );

    if (itemsVerificados.length === 0) {
      this.notificacionService.openWarn('Los items seleccionados no están verificados');
      return;
    }

    // Si hay items no verificados en la selección, mostrar advertencia
    const itemsNoVerificados = this.selectedItems.filter(item => 
      item.estadoRecepcion !== 'VERIFICADO'
    );
    if (itemsNoVerificados.length > 0) {
      this.notificacionService.openWarn('Algunos items seleccionados no están verificados y no serán procesados.');
    }

    // Mostrar diálogo de confirmación
    this.dialogosService.confirm(
      'Deshacer Verificación de Items Seleccionados',
      `Se cancelará la verificación de ${itemsVerificados.length} item(s) seleccionado(s). Esta acción no se puede deshacer.`,
      'Los items seleccionados volverán al estado PENDIENTE.',
      undefined,
      true, // action: true para mostrar botones de acción
      'Deshacer Verificación',
      'Cancelar'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.ejecutarDeshacerSeleccion(itemsVerificados);
      }
    });
  }

  /**
   * Ejecuta la cancelación de verificación para los items seleccionados
   */
  private ejecutarDeshacerSeleccion(itemsVerificados: NotaRecepcionItem[]): void {
    console.log('Ejecutando deshacer verificación de items seleccionados...');

    // Validar que tenemos sucursales seleccionadas
    if (this.sucursalesSeleccionadas.length === 0) {
      this.notificacionService.openAlgoSalioMal('Debe seleccionar al menos una sucursal');
      return;
    }

    // Crear array de promesas para cancelar verificación de los items seleccionados
    const cancelaciones: Promise<boolean>[] = [];

    itemsVerificados.forEach(item => {
      this.sucursalesSeleccionadas.forEach(sucursal => {
        cancelaciones.push(
          this.pedidoService.onCancelarVerificacion(item.id, sucursal.id).toPromise()
        );
      });
    });

    // Ejecutar todas las cancelaciones
    Promise.all(cancelaciones).then(results => {
      const exitosas = results.filter(result => result === true).length;
      const total = results.length;
      
      if (exitosas === total) {
        // Todas las cancelaciones fueron exitosas
        this.notificacionService.openSucess(
          `Verificación deshecha exitosamente para ${itemsVerificados.length} item(s) en ${this.sucursalesSeleccionadas.length} sucursal(es)`
        );
        
        // Limpiar selección después de deshacer
        this.selectedItems = [];
        this.selectAllItems = false;
        
        // Recargar items después de un breve delay para que el backend procese
        if (this.notaSeleccionada) {
          setTimeout(() => {
            this.loadItemsNotaRecepcion(this.notaSeleccionada!.id);
          }, 500);
        }
      } else if (exitosas > 0) {
        // Algunas cancelaciones fueron exitosas
        this.notificacionService.openSucess(
          `Verificación deshecha parcialmente: ${exitosas}/${total} operaciones exitosas`
        );
        
        // Limpiar selección
        this.selectedItems = [];
        this.selectAllItems = false;
        
        // Recargar items después de un breve delay
        if (this.notaSeleccionada) {
          setTimeout(() => {
            this.loadItemsNotaRecepcion(this.notaSeleccionada!.id);
          }, 500);
        }
      } else {
        // Ninguna cancelación fue exitosa
        this.notificacionService.openAlgoSalioMal('No se pudo deshacer la verificación de ningún item');
      }
    }).catch(error => {
      console.error('Error al deshacer verificación:', error);
      this.notificacionService.openAlgoSalioMal('Error al deshacer verificación: ' + error.message);
    });
  }

  /**
   * Maneja el botón "Deshacer Rechazo Todo"
   * Cancela el rechazo de todos los items rechazados de la nota
   */
  onDeshacerRechazoTodo(): void {
    if (!this.notaSeleccionada) {
      this.notificacionService.openWarn('Debe seleccionar una nota de recepción');
      return;
    }

    // Obtener todos los items rechazados de la nota
    const itemsRechazados = this.itemsDataSource.data.filter(item => 
      item.estadoRecepcion === 'RECHAZADO'
    );

    if (itemsRechazados.length === 0) {
      this.notificacionService.openWarn('No hay items rechazados para deshacer');
      return;
    }

    // Mostrar diálogo de confirmación
    this.dialogosService.confirm(
      'Deshacer Rechazo de Todos los Items',
      `Se cancelará el rechazo de ${itemsRechazados.length} item(s) rechazado(s). Esta acción no se puede deshacer.`,
      'Todos los items rechazados volverán al estado PENDIENTE.',
      undefined,
      true, // action: true para mostrar botones de acción
      'Deshacer Rechazo',
      'Cancelar'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.ejecutarDeshacerRechazoTodo(itemsRechazados);
      }
    });
  }

  /**
   * Ejecuta la cancelación de rechazo para todos los items rechazados
   */
  private ejecutarDeshacerRechazoTodo(itemsRechazados: NotaRecepcionItem[]): void {
    console.log('Ejecutando deshacer rechazo de todos los items...');

    // Validar que tenemos sucursales seleccionadas
    if (this.sucursalesSeleccionadas.length === 0) {
      this.notificacionService.openAlgoSalioMal('Debe seleccionar al menos una sucursal');
      return;
    }

    // Crear array de promesas para cancelar rechazo de todos los items
    const cancelaciones: Promise<boolean>[] = [];

    itemsRechazados.forEach(item => {
      this.sucursalesSeleccionadas.forEach(sucursal => {
        cancelaciones.push(
          this.pedidoService.onCancelarRechazo(item.id, sucursal.id).toPromise()
        );
      });
    });

    // Ejecutar todas las cancelaciones
    Promise.all(cancelaciones).then(results => {
      const exitosas = results.filter(result => result === true).length;
      const total = results.length;
      
      if (exitosas === total) {
        // Todas las cancelaciones fueron exitosas
        this.notificacionService.openSucess(
          `Rechazo deshecho exitosamente para ${itemsRechazados.length} item(s) en ${this.sucursalesSeleccionadas.length} sucursal(es)`
        );
        
        // Recargar items después de un breve delay para que el backend procese
        if (this.notaSeleccionada) {
          setTimeout(() => {
            this.loadItemsNotaRecepcion(this.notaSeleccionada!.id);
          }, 500);
        }
      } else if (exitosas > 0) {
        // Algunas cancelaciones fueron exitosas
        this.notificacionService.openSucess(
          `Rechazo deshecho parcialmente: ${exitosas}/${total} operaciones exitosas`
        );
        
        // Recargar items después de un breve delay
        if (this.notaSeleccionada) {
          setTimeout(() => {
            this.loadItemsNotaRecepcion(this.notaSeleccionada!.id);
          }, 500);
        }
      } else {
        // Ninguna cancelación fue exitosa
        this.notificacionService.openAlgoSalioMal('No se pudo deshacer el rechazo de ningún item');
      }
    }).catch(error => {
      console.error('Error al deshacer rechazo:', error);
      this.notificacionService.openAlgoSalioMal('Error al deshacer rechazo: ' + error.message);
    });
  }

  /**
   * Maneja el botón "Deshacer Rechazo Selección"
   * Cancela el rechazo de los items seleccionados
   */
  onDeshacerRechazoSeleccion(): void {
    if (this.selectedItems.length === 0) {
      this.notificacionService.openWarn('Debe seleccionar al menos un item para deshacer rechazo');
      return;
    }

    // Filtrar solo items rechazados
    const itemsRechazados = this.selectedItems.filter(item => 
      item.estadoRecepcion === 'RECHAZADO'
    );

    if (itemsRechazados.length === 0) {
      this.notificacionService.openWarn('Los items seleccionados no están rechazados');
      return;
    }

    // Si hay items no rechazados en la selección, mostrar advertencia
    const itemsNoRechazados = this.selectedItems.filter(item => 
      item.estadoRecepcion !== 'RECHAZADO'
    );
    if (itemsNoRechazados.length > 0) {
      this.notificacionService.openWarn('Algunos items seleccionados no están rechazados y no serán procesados.');
    }

    // Mostrar diálogo de confirmación
    this.dialogosService.confirm(
      'Deshacer Rechazo de Items Seleccionados',
      `Se cancelará el rechazo de ${itemsRechazados.length} item(s) seleccionado(s). Esta acción no se puede deshacer.`,
      'Los items seleccionados volverán al estado PENDIENTE.',
      undefined,
      true, // action: true para mostrar botones de acción
      'Deshacer Rechazo',
      'Cancelar'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.ejecutarDeshacerRechazoSeleccion(itemsRechazados);
      }
    });
  }

  /**
   * Ejecuta la cancelación de rechazo para los items seleccionados
   */
  private ejecutarDeshacerRechazoSeleccion(itemsRechazados: NotaRecepcionItem[]): void {
    console.log('Ejecutando deshacer rechazo de items seleccionados...');

    // Validar que tenemos sucursales seleccionadas
    if (this.sucursalesSeleccionadas.length === 0) {
      this.notificacionService.openAlgoSalioMal('Debe seleccionar al menos una sucursal');
      return;
    }

    // Crear array de promesas para cancelar rechazo de los items seleccionados
    const cancelaciones: Promise<boolean>[] = [];

    itemsRechazados.forEach(item => {
      this.sucursalesSeleccionadas.forEach(sucursal => {
        cancelaciones.push(
          this.pedidoService.onCancelarRechazo(item.id, sucursal.id).toPromise()
        );
      });
    });

    // Ejecutar todas las cancelaciones
    Promise.all(cancelaciones).then(results => {
      const exitosas = results.filter(result => result === true).length;
      const total = results.length;
      
      if (exitosas === total) {
        // Todas las cancelaciones fueron exitosas
        this.notificacionService.openSucess(
          `Rechazo deshecho exitosamente para ${itemsRechazados.length} item(s) en ${this.sucursalesSeleccionadas.length} sucursal(es)`
        );
        
        // Limpiar selección después de deshacer
        this.selectedItems = [];
        this.selectAllItems = false;
        
        // Recargar items después de un breve delay para que el backend procese
        if (this.notaSeleccionada) {
          setTimeout(() => {
            this.loadItemsNotaRecepcion(this.notaSeleccionada!.id);
          }, 500);
        }
      } else if (exitosas > 0) {
        // Algunas cancelaciones fueron exitosas
        this.notificacionService.openSucess(
          `Rechazo deshecho parcialmente: ${exitosas}/${total} operaciones exitosas`
        );
        
        // Limpiar selección
        this.selectedItems = [];
        this.selectAllItems = false;
        
        // Recargar items después de un breve delay
        if (this.notaSeleccionada) {
          setTimeout(() => {
            this.loadItemsNotaRecepcion(this.notaSeleccionada!.id);
          }, 500);
        }
      } else {
        // Ninguna cancelación fue exitosa
        this.notificacionService.openAlgoSalioMal('No se pudo deshacer el rechazo de ningún item');
      }
    }).catch(error => {
      console.error('Error al deshacer rechazo:', error);
      this.notificacionService.openAlgoSalioMal('Error al deshacer rechazo: ' + error.message);
    });
  }
} 