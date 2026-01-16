import { Component, Input, Output, OnInit, OnDestroy, ViewChild, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
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
  itemsDisplayedColumns = ['producto', 'presentacion', 'cantidadEsperada', 'cantidadRecibida', 'cantidadRechazada', 'estado', 'acciones'];

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
        
        // Si hay items cargados, refrescar la tabla localmente
        if (this.items.length > 0) {
          this.refrescarTablaItems();
        } else if (this.notaSeleccionada) {
          // Si no hay items cargados, cargar desde backend
          this.loadItemsNotaRecepcion(this.notaSeleccionada.id);
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
    
    // Convertir filtro para compatibilidad con el backend
    const filtroBackend = this.convertirFiltroParaBackend(this.filtroVerificacion());
    
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
            const items = pageInfo.getContent.map((item: any) => {
              // Los datos ya vienen con los campos de recepción física del backend
              // No necesitamos conversión adicional
              return item;
            });

            this.items = items;
            this.itemsTotalElements = pageInfo.getTotalElements || 0;
          } else {
            this.items = [];
            this.itemsTotalElements = 0;
            console.warn(`No se encontraron items con filtro '${this.filtroVerificacion()}' para la nota de recepción:`, notaId);
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
    // Verificar que el ítem esté pendiente
    if (item.estadoRecepcion !== 'PENDIENTE') {
      this.notificacionService.openAlgoSalioMal('Este ítem ya fue verificado');
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
          
          // Buscar la distribución que coincida con la sucursal seleccionada
          const distribucionEncontrada = distribuciones.find(dist => 
            dist.sucursalEntrega?.id === sucursalSeleccionada.id
          );
          
          // Crear input para guardar
          const itemInput: any = {
            notaRecepcionItemId: item.id,
            productoId: item.producto?.id,
            presentacionRecibidaId: item.presentacionEnNota?.id || null,
            sucursalEntregaId: sucursalSeleccionada.id,
            usuarioId: 1, // TODO: Obtener usuario actual del sistema de autenticación
            cantidadRecibida: item.cantidadEsperadaComputed || 0,
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
        return item.estadoRecepcion === 'PENDIENTE';
      case 'VERIFICADOS':
        return item.estadoRecepcion === 'VERIFICADO';
      case 'RECHAZADOS':
        return item.estadoRecepcion === 'RECHAZADO';
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
    console.log('Cancelando verificación para item:', item);
    
    // Usar diálogo genérico del sistema
    this.dialogosService.confirm(
      'Cancelar Verificación',
      '¿Está seguro que desea cancelar la verificación de este ítem?',
      'Esta acción no se puede deshacer.',
      undefined,
      true,
      'Cancelar',
      'No Cancelar'
    ).subscribe(result => {
      if (result) {
      this.ejecutarCancelacionVerificacion(item);
    }
    });
  }

  onCancelarRechazo(item: NotaRecepcionItem): void {
    console.log('Cancelando rechazo para item:', item);
    
    // Usar diálogo genérico del sistema
    this.dialogosService.confirm(
      'Cancelar Rechazo',
      '¿Está seguro que desea cancelar el rechazo de este ítem?',
      'Esta acción no se puede deshacer.',
      undefined,
      true,
      'Cancelar',
      'No Cancelar'
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
    console.log('Ejecutando cancelación de verificación...');

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
        this.notificacionService.openSucess(`Verificación cancelada exitosamente en ${exitosas} sucursal(es)`);
      } else if (exitosas > 0) {
        // Algunas cancelaciones fueron exitosas
        this.actualizarUIItemCancelado(item);
        this.notificacionService.openSucess(`Verificación cancelada parcialmente: ${exitosas}/${total} sucursales`);
      } else {
        // Ninguna cancelación fue exitosa
        this.notificacionService.openAlgoSalioMal('No se pudo cancelar la verificación en ninguna sucursal');
      }
    }).catch(error => {
      console.error('Error al cancelar verificación:', error);
      this.notificacionService.openAlgoSalioMal('Error al cancelar verificación: ' + error.message);
    });
  }

  /**
   * Ejecuta la cancelación de rechazo
   */
  private ejecutarCancelacionRechazo(item: NotaRecepcionItem): void {
    console.log('Ejecutando cancelación de rechazo...');

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
        this.notificacionService.openSucess(`Rechazo cancelado exitosamente en ${exitosas} sucursal(es)`);
      } else if (exitosas > 0) {
        // Algunas cancelaciones fueron exitosas
        this.actualizarUIItemRechazoCancelado(item);
        this.notificacionService.openSucess(`Rechazo cancelado parcialmente: ${exitosas}/${total} sucursales`);
      } else {
        // Ninguna cancelación fue exitosa
        this.notificacionService.openAlgoSalioMal('No se pudo cancelar el rechazo en ninguna sucursal');
      }
    }).catch(error => {
      console.error('Error al cancelar rechazo:', error);
      this.notificacionService.openAlgoSalioMal('Error al cancelar rechazo: ' + error.message);
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
    // Actualizar estado del ítem
    item.estadoRecepcion = 'PENDIENTE';
    item.cantidadRecibida = 0;
    item.cantidadRechazada = 0;
    // No tenemos recepcionMercaderiaId en NotaRecepcionItem, se maneja en el backend

    // Actualizar propiedades computadas
    this.updateItemsComputedProperties();
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
          
          // Agrupar distribuciones por sucursal de entrega
          const distribucionesAgrupadas = this.agruparDistribucionesPorSucursal(distribucionesFiltradas);
          
          console.log('Distribuciones agrupadas por sucursal:', distribucionesAgrupadas);
          
          // Abrir diálogo con los datos agrupados
          const dialogRef = this.dialog.open(RecepcionMercaderiaRechazarItemDialogComponent, {
            width: '60%',
            height: '60%',
            data: {
              item: item,
              distribuciones: distribucionesAgrupadas,
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
          
          // Actualizar estado local del item
          const cantidadTotalRechazada = result.rechazos.reduce((total: number, rechazo: any) => {
            return total + rechazo.cantidadRechazada;
          }, 0);

          item.cantidadRechazada = cantidadTotalRechazada;
          item.estadoRecepcion = 'RECHAZADO';
          
          // Notificar éxito
          this.notificacionService.openSucess('Rechazo registrado exitosamente');
          
          // Actualizar propiedades computadas
          this.updateComputedProperties();
          
          console.log('Rechazo procesado:', {
            itemId: item.id,
            cantidadTotalRechazada,
            rechazos: result.rechazos.length,
            detalleRechazos: result.rechazos.map((r: any) => ({
              sucursalId: r.sucursalId,
              cantidadRechazada: r.cantidadRechazada,
              motivoRechazo: r.motivoRechazo
            }))
          });
        },
        error: (error) => {
          console.error('Error al procesar rechazo:', error);
          this.notificacionService.openAlgoSalioMal('Error al registrar rechazo: ' + (error.message || 'Error desconocido'));
        }
      });
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
  getEstadoChipClass(estado: string): string {
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

  getEstadoText(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'PENDIENTE';
      case 'VERIFICADO':
        return 'VERIFICADO';
      case 'RECHAZADO':
        return 'RECHAZADO';
      case 'PARCIAL':
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
} 