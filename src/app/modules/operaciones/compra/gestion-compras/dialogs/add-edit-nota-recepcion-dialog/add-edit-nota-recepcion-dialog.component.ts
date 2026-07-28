import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, first } from 'rxjs/operators';

import { NotaRecepcion, NotaRecepcionEstado, TipoBoleta } from '../../nota-recepcion.model';
import { NotaRecepcionItem, NotaRecepcionItemEstado } from '../../nota-recepcion-item.model';
import { Pedido } from '../../pedido.model';
import { Moneda } from '../../../../../financiero/moneda/moneda.model';
import { MonedaService } from '../../../../../financiero/moneda/moneda.service';
import { CambioService } from '../../../../../financiero/cambio/cambio.service';
import { PedidoService } from '../../../pedido.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../../shared/components/dialogos/dialogos.service';
import { EditNotaRecepcionItemDialogComponent } from '../edit-nota-recepcion-item-dialog/edit-nota-recepcion-item-dialog.component';
import { RechazarItemDialogComponent } from '../rechazar-item-dialog/rechazar-item-dialog.component';
import { DistributeNotaRecepcionItemDialogComponent } from '../distribute-nota-recepcion-item-dialog/distribute-nota-recepcion-item-dialog.component';
import { MainService } from '../../../../../../main.service';

export interface AddEditNotaRecepcionDialogData {
  nota?: NotaRecepcion;
  pedido?: Pedido;
  isEdit: boolean;
  /** Si true, el diálogo se abre en modo solo lectura; no se permite modificar nada. */
  readOnly?: boolean;
  // Nuevos campos para asignación automática de ítems
  selectedItemsToAssign?: any[]; // MockPedidoItem[] from parent component
  autoAssignItems?: boolean; // Flag para indicar si debe asignar ítems automáticamente
  assignAllItems?: boolean; // Flag para indicar que se deben asignar TODOS los items pendientes (independiente de la paginación)
}

export interface AddEditNotaRecepcionDialogResult {
  success: boolean;
  message?: string;
  changesMade: boolean;
  operation?: 'created' | 'updated' | 'deleted_item' | 'deleted' | 'no_changes';
}

@Component({
  selector: 'app-add-edit-nota-recepcion-dialog',
  templateUrl: './add-edit-nota-recepcion-dialog.component.html',
  styleUrls: ['./add-edit-nota-recepcion-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditNotaRecepcionDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('guardarButton', { static: false }) guardarButton!: MatButton;
  @ViewChild('cancelButton', { static: false }) cancelButton!: MatButton;
  @ViewChild('salirButton', { static: false }) salirButton!: MatButton;
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;
  
  // ViewChild para los campos del formulario
  @ViewChild('tipoBoletaSelect', { static: false }) tipoBoletaSelect!: any;
  @ViewChild('numeroInput', { static: false }) numeroInput!: any;
  @ViewChild('timbradoInput', { static: false }) timbradoInput!: any;
  @ViewChild('fechaInput', { static: false }) fechaInput!: any;

  notaRecepcionForm: FormGroup;
  dialogTitle: string;
  actionButtonText: string;
  tipoBoletaList = Object.values(TipoBoleta);
  estadosDisponibles = Object.values(NotaRecepcionEstado);
  NotaRecepcionEstado = NotaRecepcionEstado;

  // Datos mock - en producción vendrían del servicio
  monedas: Moneda[] = [];

  // Propiedades para la tabla de ítems
  itemsDataSource = new MatTableDataSource<NotaRecepcionItem>([]);
  displayedColumns: string[] = ['producto', 'presentacion', 'cantidad', 'precio', 'subtotal', 'vencimiento', 'distribucion', 'acciones'];
  /** Modo solo lectura: formulario y acciones deshabilitados. */
  readOnly = false;

  // PROPIEDADES COMPUTADAS - NO usar funciones en templates
  // Error states para cada campo
  tipoBoletaRequiredError: boolean = false;
  tipoBoletaMaxLengthError: boolean = false;
  tipoBoletaErrorMessage: string = '';
  
  numeroRequiredError: boolean = false;
  numeroErrorMessage: string = '';
  
  fechaRequiredError: boolean = false;
  fechaErrorMessage: string = '';
  
  monedaRequiredError: boolean = false;
  monedaErrorMessage: string = '';
  
  cotizacionRequiredError: boolean = false;
  cotizacionMinError: boolean = false;
  cotizacionErrorMessage: string = '';

  // Propiedades computadas para el card informativo
  totalItemsComputed: number = 0;
  montoTotalComputed: number = 0;
  montoParcialComputed: number = 0;
  montoRechazadoComputed: number = 0;
  montoFinalComputed: number = 0;
  tieneItemsRechazados: boolean = false;
  estadoDisplayName: string = '';
  estadoChipClass: string = '';
  pagadoDisplayText: string = '';
  pagadoChipClass: string = '';
  
  // Propiedades para notas de rechazo
  esNotaRechazoComputed: boolean = false;
  notaRechazoDisplayText: string = '';
  notaRechazoChipClass: string = '';

  // Propiedades computadas para items (se actualizan cuando cambia itemsDataSource)
  computedItemsData: any[] = [];

  // Moneda y estado de acciones — precalculados, no usar getters en template
  notaSimbolo = '';
  notaDecimalFormat = '1.0-0';
  mostrarHintCotizacionMercado = false;
  hayCambiosPendientes = false;
  tieneItemsPendientesConciliacion = false;
  puedeGuardar = false;
  puedeCancelar = false;
  textoBotonSalir = 'Salir';

  // Propiedades para asignación automática
  assignmentStatusText: string = '';
  assignmentStatusClass: string = '';
  assignmentStatusClassFull: string = 'assignment-text';
  showAssignmentStatus: boolean = false;

  // Bandera para saber si ya se creó la nota en esta sesión del diálogo
  private notaCreada: boolean = false;
  /** Si el diálogo se abrió en modo edición (nota ya existente). */
  private readonly initialIsEdit: boolean;

  /** IDs de ítems agregados en esta sesión (modo edición ABM). */
  private itemsAgregadosEnSesion: number[] = [];

  /** Snapshot del formulario para revertir cambios del encabezado. */
  private notaFormSnapshot: Record<string, unknown> | null = null;
  
  // Bandera para rastrear si se hicieron cambios en el diálogo
  private changesMade: boolean = false;
  
  // Propiedades para asignación automática de ítems
  private selectedItemsToAssign: any[] = [];
  private autoAssignItems: boolean = false;
  private assignAllItems: boolean = false;
  private assigningItems: boolean = false;
  
  // Subject para manejo de memoria
  private destroy$ = new Subject<void>();
  
  // Loading states
  loadingMonedas = false;
  loadingItems = false;
  savingNota = false;
  deletingNota = false;
  
  // Estados para manejo de selects en navegación
  tipoBoletaSelectOpen = false;
  monedaSelectOpen = false;

  constructor(
    public dialogRef: MatDialogRef<AddEditNotaRecepcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddEditNotaRecepcionDialogData,
    private formBuilder: FormBuilder,
    private monedaService: MonedaService,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private dialog: MatDialog,
    private cambioService: CambioService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {
    this.readOnly = !!data.readOnly;
    this.textoBotonSalir = this.readOnly ? 'Cerrar' : 'Salir';
    this.initialIsEdit = data.isEdit;
    this.dialogTitle = this.readOnly ? 'Ver Nota de Recepción' : (data.isEdit ? 'Editar Nota de Recepción' : 'Nueva Nota de Recepción');
    this.actionButtonText = data.isEdit ? 'Actualizar' : 'Crear';
    this.notaCreada = false;
    
    // Inicializar propiedades para asignación automática
    this.selectedItemsToAssign = data.selectedItemsToAssign || [];
    this.autoAssignItems = data.autoAssignItems || false;
    this.assignAllItems = data.assignAllItems || false;
    
    // Ajustar título si se van a asignar ítems automáticamente
    if (this.autoAssignItems && this.selectedItemsToAssign.length > 0) {
      this.dialogTitle = `Nueva Nota de Recepción (${this.selectedItemsToAssign.length} ítems seleccionados)`;
    }
  }

  private loadMonedas(): void {
    this.loadingMonedas = true;
    
    this.monedaService.onGetAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (monedas: Moneda[]) => {
          this.monedas = monedas;
          this.loadingMonedas = false;

          // Si no hay moneda seleccionada (creación), prefilear con la del pedido
          // (buscamos por id en el array cargado para conservar la misma instancia que usa mat-option).
          // Fallback: primera moneda disponible.
          if (this.notaRecepcionForm && !this.notaRecepcionForm.get('moneda')?.value && monedas.length > 0) {
            const pedidoMonedaId = this.data.pedido?.moneda?.id;
            const monedaPedido = pedidoMonedaId ? monedas.find(m => m.id === pedidoMonedaId) : null;
            const monedaDefault = monedaPedido || monedas[0];
            this.notaRecepcionForm.patchValue({ moneda: monedaDefault }, { emitEvent: false });

            // Cotización: si la moneda del pedido es no-Gs y tiene cotización fijada, prefilear.
            if (
              !this.data.isEdit &&
              monedaDefault?.denominacion !== 'GUARANI' &&
              this.data.pedido?.cotizacion
            ) {
              this.notaRecepcionForm.patchValue(
                { cotizacion: this.data.pedido.cotizacion },
                { emitEvent: false }
              );
            }
            this.updateComputedProperties();
          }
        },
        error: (error) => {
          console.error('Error al cargar monedas:', error);
          this.notificacionService.openAlgoSalioMal('Error al cargar las monedas');
          this.loadingMonedas = false;
        }
      });
  }

  private loadCotizacionFromCambio(monedaId?: number): void {
    const id = monedaId || this.data.pedido?.moneda?.id;
    const denominacion = this.data.pedido?.moneda?.denominacion;
    if (!id || denominacion === 'GUARANI') {
      if (!monedaId) return; // Initial call — skip for Guarani
      // Explicit moneda change to Guarani — reset to 1
      this.notaRecepcionForm.patchValue({ cotizacion: 1 });
      return;
    }

    // 1. Si el pedido tiene cotización fijada, prefill desde ahí (override editable).
    //    Solo aplica cuando la moneda de la nota coincide con la del pedido — al cambiarla
    //    explícitamente, recae en el prefill del mercado.
    const pedidoCotizacion = this.data.pedido?.cotizacion;
    const pedidoMonedaId = this.data.pedido?.moneda?.id;
    if (pedidoCotizacion != null && (!monedaId || monedaId === pedidoMonedaId)) {
      const currentCotizacion = this.notaRecepcionForm.get('cotizacion')?.value;
      if (!currentCotizacion || currentCotizacion === 1) {
        this.notaRecepcionForm.patchValue({ cotizacion: pedidoCotizacion });
      }
      return;
    }

    // 2. Fallback: prefill desde mercado (lógica anterior)
    this.cambioService.getUltimoCambioPorMonedaId(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cambio) => {
          if (cambio) {
            const tasa = cambio.valorEnGsCompraMercado ?? cambio.valorEnGsVentaMercado ?? cambio.valorEnGs;
            if (tasa && tasa > 0) {
              const currentCotizacion = this.notaRecepcionForm.get('cotizacion')?.value;
              // Only auto-fill if still at default (1) or empty
              if (!currentCotizacion || currentCotizacion === 1) {
                this.notaRecepcionForm.patchValue({ cotizacion: tasa });
              }
            }
          }
        }
      });
  }

  ngOnInit(): void {
    this.loadMonedas();
    this.initializeForm();
    this.setupKeyboardNavigation();
    this.loadItems();
    this.updateComputedProperties();

    // Auto-fill cotización desde último Cambio (solo al crear, no al editar)
    if (!this.data.isEdit) {
      this.loadCotizacionFromCambio();
    }

    // Modo solo lectura o nota de rechazo: deshabilitar el formulario
    if (this.readOnly || this.data.nota?.esNotaRechazo) {
      this.notaRecepcionForm.disable();
    }
    // En modo solo lectura, no mostrar columna de acciones en la tabla de ítems
    if (this.readOnly) {
      this.displayedColumns = ['producto', 'presentacion', 'cantidad', 'precio', 'subtotal', 'vencimiento', 'distribucion'];
    }

    if (this.initialIsEdit) {
      setTimeout(() => this.saveFormSnapshot(), 0);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    // Configurar paginador si está disponible
    if (this.paginator) {
      this.itemsDataSource.paginator = this.paginator;
    }
    
    // Si es una nueva nota, enfocar el input "Numero" directamente
    // Usar tabindex en el HTML para cambiar el orden, y aquí asegurar el foco
    if (!this.data.isEdit) {
      setTimeout(() => {
        if (this.numeroInput && this.numeroInput.nativeElement) {
          this.numeroInput.nativeElement.focus();
        }
      }, 300);
    }
  }

  private initializeForm(): void {
    this.notaRecepcionForm = this.formBuilder.group({
      numero: [
        this.data.nota?.numero || '', 
        [Validators.required]
      ],
      timbrado: [
        this.data.nota?.timbrado || ''
      ],
      tipoBoleta: [
        this.data.nota?.tipoBoleta || TipoBoleta.FACTURA,
        [Validators.required]
      ],
      fecha: [
        this.data.nota?.fecha ? new Date(this.data.nota.fecha) : new Date(),
        [Validators.required]
      ],
      moneda: [
        this.data.nota?.moneda || this.monedas[0],
        [Validators.required]
      ],
      cotizacion: [
        this.data.nota?.cotizacion || 1,
        [Validators.required, Validators.min(0)]
      ],
      estado: [
        this.data.nota?.estado || NotaRecepcionEstado.PENDIENTE_CONCILIACION
      ],
      pagado: [
        this.data.nota?.pagado || false
      ]
    });

    // Suscribirse a cambios para actualizar propiedades computadas
    this.notaRecepcionForm.valueChanges.subscribe(() => {
      this.updateComputedProperties();
    });

    // Auto-fill cotización cuando cambia la moneda
    this.notaRecepcionForm.get('moneda')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((moneda: Moneda) => {
        if (!this.data.isEdit && moneda) {
          if (moneda.denominacion === 'GUARANI') {
            this.notaRecepcionForm.patchValue({ cotizacion: 1 });
          } else {
            // Reset cotizacion to trigger auto-fill
            this.notaRecepcionForm.patchValue({ cotizacion: 1 }, { emitEvent: false });
            this.loadCotizacionFromCambio(moneda.id);
          }
        }
      });
  }

  private loadItems(): void {
    this.loadingItems = true;
    
    if (this.data.isEdit && this.data.nota) {
      // En modo edición, cargar ítems reales de la nota
      this.pedidoService.onGetNotaRecepcionItemListPorNotaRecepcionId(this.data.nota.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (items: NotaRecepcionItem[]) => {
            this.itemsDataSource.data = items;
            this.loadingItems = false;
            this.updateComputedProperties();
          },
          error: (error) => {
            console.error('Error al cargar ítems de nota de recepción:', error);
            this.notificacionService.openAlgoSalioMal('Error al cargar los ítems de la nota de recepción');
            this.itemsDataSource.data = [];
            this.loadingItems = false;
            this.updateComputedProperties();
          }
        });
    } else {
      // En modo creación, mostrar lista vacía
      this.itemsDataSource.data = [];
      this.loadingItems = false;
      this.updateComputedProperties();
    }
  }

  private setupKeyboardNavigation(): void {
    // Sistema de navegación eliminado para evitar conflictos
    // Ahora usamos solo los eventos individuales de cada campo
  }

  private focusNextField(fieldName: string): void {
    switch (fieldName) {
      case 'numero':
        if (this.numeroInput) {
          this.numeroInput.nativeElement.focus();
        }
        break;
      case 'timbrado':
        if (this.timbradoInput) {
          this.timbradoInput.nativeElement.focus();
        }
        break;
      case 'fecha':
        if (this.fechaInput) {
          this.fechaInput.nativeElement.focus();
        }
        break;
    }
  }

  // Métodos para manejar eventos de selects
  onTipoBoletaOpened(): void {
    this.tipoBoletaSelectOpen = true;
  }

  onTipoBoletaClosed(): void {
    this.tipoBoletaSelectOpen = false;
    // Si el campo es válido, navegar al siguiente
    const currentControl = this.notaRecepcionForm.get('tipoBoleta');
    if (currentControl && currentControl.valid) {
      setTimeout(() => {
        this.focusNextField('numero');
      }, 100);
    }
  }

  onTipoBoletaSelectionChange(): void {
    // Cuando se selecciona una opción, cerrar el select y navegar
    if (this.tipoBoletaSelectOpen) {
      this.tipoBoletaSelectOpen = false;
      setTimeout(() => {
        this.focusNextField('numero');
      }, 100);
    }
  }

  onTipoBoletaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!this.tipoBoletaSelectOpen) {
        // Si el select no está abierto, abrirlo
        if (this.tipoBoletaSelect) {
          this.tipoBoletaSelect.open();
        }
      } else {
        // Si el select está abierto, cerrarlo y navegar al siguiente
        if (this.tipoBoletaSelect) {
          this.tipoBoletaSelect.close();
        }
      }
    }
  }

  // Métodos para manejar keydown en inputs
  onNumeroKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const currentControl = this.notaRecepcionForm.get('numero');
      if (currentControl && currentControl.valid) {
        // Navegar al timbrado sin validar si es válido (no es requerido)
        this.focusNextField('timbrado');
      } else {
        currentControl?.markAsTouched();
        this.updateComputedProperties();
      }
    }
  }

  onTimbradoKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      // El campo timbrado no es requerido, por lo que siempre navegamos al siguiente
      this.focusNextField('fecha');
    }
  }

  onFechaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const currentControl = this.notaRecepcionForm.get('fecha');
      if (currentControl && currentControl.valid) {
        // Enfocar botón guardar
        setTimeout(() => {
          if (this.guardarButton) {
            this.guardarButton._elementRef.nativeElement.focus();
          }
        }, 100);
      } else {
        currentControl?.markAsTouched();
        this.updateComputedProperties();
      }
    }
  }

  onGuardarButtonKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.puedeGuardar) {
        this.onSave();
      } else {
        // Marcar todos los campos como touched para mostrar errores
        Object.keys(this.notaRecepcionForm.controls).forEach(key => {
          this.notaRecepcionForm.get(key)?.markAsTouched();
        });
        this.updateComputedProperties();
      }
    }
  }

  updateComputedProperties(): void {
    this.updateErrorStates();
    this.updateCardProperties();
    this.updateItemsComputedData();
    this.updateAssignmentStatus();
    this.actualizarEstadoAcciones();
    this.cdr.markForCheck();
  }

  private actualizarEstadoAcciones(): void {
    const formularioListo = !!this.notaRecepcionForm;
    this.hayCambiosPendientes = formularioListo
      && (this.notaRecepcionForm.dirty || this.itemsAgregadosEnSesion.length > 0);
    this.tieneItemsPendientesConciliacion = this.evaluarItemsPendientesConciliacion();

    if (
      !formularioListo
      || this.notaRecepcionForm.invalid
      || this.esNotaRechazoComputed
      || this.deletingNota
      || this.savingNota
      || this.tieneItemsPendientesConciliacion
    ) {
      this.puedeGuardar = false;
    } else if (!this.initialIsEdit && !this.notaCreada) {
      this.puedeGuardar = true;
    } else {
      this.puedeGuardar = this.hayCambiosPendientes;
    }

    if (this.readOnly || this.deletingNota) {
      this.puedeCancelar = false;
    } else if (!this.initialIsEdit && this.notaCreada && !!this.data.nota?.id) {
      this.puedeCancelar = true;
    } else {
      this.puedeCancelar = this.initialIsEdit && this.hayCambiosPendientes;
    }
  }

  /**
   * Ítems agregados en sesión con distribución o conciliación incompleta.
   */
  private evaluarItemsPendientesConciliacion(): boolean {
    if (this.itemsAgregadosEnSesion.length === 0) {
      return false;
    }

    return this.itemsDataSource.data.some(item => {
      if (!item.id || !this.itemsAgregadosEnSesion.includes(item.id)) {
        return false;
      }
      if (item.estado === NotaRecepcionItemEstado.RECHAZADO) {
        return false;
      }
      return !item.distribucionConcluida;
    });
  }

  private updateErrorStates(): void {
    const form = this.notaRecepcionForm;
    
    // TipoBoleta errors
    const tipoBoletaControl = form.get('tipoBoleta');
    this.tipoBoletaRequiredError = !!(tipoBoletaControl?.hasError('required') && tipoBoletaControl?.touched);
    this.tipoBoletaMaxLengthError = !!(tipoBoletaControl?.hasError('maxLength') && tipoBoletaControl?.touched);
    this.tipoBoletaErrorMessage = this.tipoBoletaRequiredError ? 'Este campo es requerido' : 
                                  this.tipoBoletaMaxLengthError ? 'El texto es demasiado largo' : '';

    // Numero errors
    const numeroControl = form.get('numero');
    this.numeroRequiredError = !!(numeroControl?.hasError('required') && numeroControl?.touched);
    this.numeroErrorMessage = this.numeroRequiredError ? 'Este campo es requerido' : '';

    // Fecha errors
    const fechaControl = form.get('fecha');
    this.fechaRequiredError = !!(fechaControl?.hasError('required') && fechaControl?.touched);
    this.fechaErrorMessage = this.fechaRequiredError ? 'Este campo es requerido' : '';

    // Moneda errors
    const monedaControl = form.get('moneda');
    this.monedaRequiredError = !!(monedaControl?.hasError('required') && monedaControl?.touched);
    this.monedaErrorMessage = this.monedaRequiredError ? 'Este campo es requerido' : '';

    // Cotizacion errors
    const cotizacionControl = form.get('cotizacion');
    this.cotizacionRequiredError = !!(cotizacionControl?.hasError('required') && cotizacionControl?.touched);
    this.cotizacionMinError = !!(cotizacionControl?.hasError('min') && cotizacionControl?.touched);
    this.cotizacionErrorMessage = this.cotizacionRequiredError ? 'Este campo es requerido' : 
                                  this.cotizacionMinError ? 'El valor debe ser mayor a 0' : '';
  }

  private updateCardProperties(): void {
    // Total items
    this.totalItemsComputed = this.itemsDataSource.data.length;
    
    // Monto total y breakdown por estado
    this.montoTotalComputed = this.itemsDataSource.data.reduce((total, item) =>
      total + (item.cantidadEnNota * item.precioUnitarioEnNota), 0);

    this.montoRechazadoComputed = this.itemsDataSource.data
      .filter(item => item.estado === 'RECHAZADO')
      .reduce((total, item) => total + (item.cantidadEnNota * item.precioUnitarioEnNota), 0);

    this.montoParcialComputed = this.montoTotalComputed - this.montoRechazadoComputed;
    this.montoFinalComputed = this.montoParcialComputed;
    this.tieneItemsRechazados = this.montoRechazadoComputed > 0;
    
    // Estado display name
    const estadoValue = this.notaRecepcionForm.get('estado')?.value;
    this.estadoDisplayName = this.getEstadoDisplayNameInternal(estadoValue);
    this.estadoChipClass = this.getEstadoChipClassInternal(estadoValue);
    
    // Pagado display
    const pagadoValue = this.notaRecepcionForm.get('pagado')?.value;
    this.pagadoDisplayText = pagadoValue ? 'Sí' : 'No';
    this.pagadoChipClass = pagadoValue ? 'true' : 'false';
    
    // Propiedades para notas de rechazo
    this.esNotaRechazoComputed = this.data.nota?.esNotaRechazo || false;
    this.notaRechazoDisplayText = this.esNotaRechazoComputed ? 'Nota de Rechazo' : '';
    this.notaRechazoChipClass = this.esNotaRechazoComputed ? 'estado-cancelado' : '';

    const moneda = this.notaRecepcionForm.get('moneda')?.value;
    this.notaSimbolo = moneda?.simbolo || '';
    this.notaDecimalFormat = moneda?.denominacion === 'GUARANI' ? '1.0-0' : '1.0-2';

    const cotizacion = this.notaRecepcionForm.get('cotizacion')?.value;
    this.mostrarHintCotizacionMercado = cotizacion > 1;
  }

  private updateItemsComputedData(): void {
    this.computedItemsData = this.itemsDataSource.data.map(item => {
      return {
        ...item,
        productoNombre: item.producto?.descripcion || item.pedidoItem?.producto?.descripcion || 'Producto no especificado',
        presentacionDisplay: item.presentacionEnNota?.descripcion || '',
        presentacionCantidad: item.presentacionEnNota?.cantidad || 1,
        cantidadDisplay: item.cantidadEnNota || 0,
        cantidadPorPresentacion: item.presentacionEnNota?.cantidad ? (item.cantidadEnNota || 0) / item.presentacionEnNota.cantidad : item.cantidadEnNota || 0,
        precioDisplay: item.precioUnitarioEnNota || 0,
        subtotalDisplay: (item.cantidadEnNota || 0) * (item.precioUnitarioEnNota || 0),
        estadoChipClass: this.getItemEstadoChipClassInternal(item.estado),
        estadoDisplayName: this.getItemEstadoDisplayNameInternal(item.estado),
        vencimientoDisplay: item.vencimientoEnNota ? this.formatDate(new Date(item.vencimientoEnNota)) : 'N/A',
        esBonificacionDisplay: item.esBonificacion ? 'Sí' : 'No',
        rowColorClass: this.getRowColorClassInternal(item.estado),
        // Nuevos campos de distribución
        distribucionStatusTextComputed: this.esNotaRechazoComputed || item.estado === 'RECHAZADO' ? 'Rechazado' : (item.distribucionConcluida ? 'Completa' : 'Pendiente'),
        distribucionStatusClassComputed: this.esNotaRechazoComputed || item.estado === 'RECHAZADO' ? 'estado-cancelado' : (item.distribucionConcluida ? 'estado-activo' : 'estado-pendiente'),
        cantidadPendienteComputed: item.cantidadPendiente || 0
      };
    });
  }

  private updateAssignmentStatus(): void {
    this.showAssignmentStatus = this.autoAssignItems && this.selectedItemsToAssign.length > 0;
    
    if (this.showAssignmentStatus) {
      if (this.assigningItems) {
        this.assignmentStatusText = `Asignando ${this.selectedItemsToAssign.length} ítems...`;
        this.assignmentStatusClass = 'estado-pendiente';
      } else {
        this.assignmentStatusText = `${this.selectedItemsToAssign.length} ítems serán asignados automáticamente`;
        this.assignmentStatusClass = 'estado-activo';
      }
    } else {
      this.assignmentStatusText = '';
      this.assignmentStatusClass = '';
    }

    this.assignmentStatusClassFull = this.showAssignmentStatus
      ? `assignment-text ${this.assignmentStatusClass}`
      : 'assignment-text';
  }

  // Métodos internos para computar valores (NO usar en templates)
  private getEstadoDisplayNameInternal(estado: NotaRecepcionEstado): string {
    switch (estado) {
      case NotaRecepcionEstado.PENDIENTE_CONCILIACION:
        return 'Pendiente Conciliación';
      case NotaRecepcionEstado.CONCILIADA:
        return 'Conciliada';
      case NotaRecepcionEstado.EN_RECEPCION:
        return 'En Recepción';
      case NotaRecepcionEstado.RECEPCION_PARCIAL:
        return 'Recepción Parcial';
      case NotaRecepcionEstado.RECEPCION_COMPLETA:
        return 'Recepción Completa';
      case NotaRecepcionEstado.CERRADA:
        return 'Cerrada';
      default:
        return estado || '';
    }
  }

  private getEstadoChipClassInternal(estado: NotaRecepcionEstado): string {
    switch (estado) {
      case NotaRecepcionEstado.PENDIENTE_CONCILIACION:
        return 'estado-pendiente';
      case NotaRecepcionEstado.CONCILIADA:
        return 'estado-activo';
      case NotaRecepcionEstado.EN_RECEPCION:
        return 'estado-activo';
      case NotaRecepcionEstado.RECEPCION_PARCIAL:
        return 'estado-pendiente';
      case NotaRecepcionEstado.RECEPCION_COMPLETA:
        return 'estado-activo';
      case NotaRecepcionEstado.CERRADA:
        return 'estado-cancelado';
      default:
        return 'estado-pendiente';
    }
  }

  private getItemEstadoChipClassInternal(estado: NotaRecepcionItemEstado | string): string {
    // Convertir a string para comparación
    const estadoStr = estado?.toString() || '';
    
    switch (estadoStr) {
      case NotaRecepcionItemEstado.CONCILIADO:
      case 'CONCILIADO':
        return 'estado-activo';
      case NotaRecepcionItemEstado.RECHAZADO:
      case 'RECHAZADO':
        return 'estado-cancelado';
      case NotaRecepcionItemEstado.DISCREPANCIA:
      case 'DISCREPANCIA':
        return 'estado-pendiente';
      default:
        return 'estado-pendiente';
    }
  }

  private getItemEstadoDisplayNameInternal(estado: NotaRecepcionItemEstado | string): string {
    // Convertir a string para comparación
    const estadoStr = estado?.toString() || '';
    
    switch (estadoStr) {
      case NotaRecepcionItemEstado.CONCILIADO:
      case 'CONCILIADO':
        return 'Conciliado';
      case NotaRecepcionItemEstado.RECHAZADO:
      case 'RECHAZADO':
        return 'Rechazado';
      case NotaRecepcionItemEstado.DISCREPANCIA:
      case 'DISCREPANCIA':
        return 'Discrepancia';
      default:
        return estadoStr || 'Pendiente';
    }
  }

  private getRowColorClassInternal(estado: NotaRecepcionItemEstado | string): string {
    // Convertir a string para comparación
    const estadoStr = estado?.toString() || '';
    
    switch (estadoStr) {
      case NotaRecepcionItemEstado.CONCILIADO:
      case 'CONCILIADO':
        return 'row-conciliado';
      case NotaRecepcionItemEstado.RECHAZADO:
      case 'RECHAZADO':
        return 'row-rechazado';
      case NotaRecepcionItemEstado.DISCREPANCIA:
      case 'DISCREPANCIA':
        return 'row-discrepancia';
      default:
        return 'row-pendiente';
    }
  }

  // Métodos para manejo de ítems
  onAddItem(): void {
    // No permitir agregar ítems si es nota de rechazo
    if (this.esNotaRechazoComputed) {
      this.notificacionService.openAlgoSalioMal('No se pueden agregar ítems a una nota de rechazo');
      return;
    }
    
    // Verificar que la nota esté creada
    if (!this.data.nota?.id) {
      this.notificacionService.openAlgoSalioMal('Debe guardar la nota antes de agregar ítems');
      return;
    }

    // Abrir diálogo para agregar nuevo ítem
    const dialogRef = this.dialog.open(EditNotaRecepcionItemDialogComponent, {
      width: '70%',
      height: '70%',
      data: {
        notaRecepcionId: this.data.nota.id,
        isNewItem: true
      },
      disableClose: true
    });

    // Manejar resultado del diálogo
    dialogRef.afterClosed().subscribe((result: NotaRecepcionItem) => {
      if (result?.id) {
        if (this.initialIsEdit || this.notaCreada) {
          this.itemsAgregadosEnSesion.push(result.id);
        }
        this.changesMade = true;
        this.loadItems();
      }
    });
  }

  onEditItem(item: NotaRecepcionItem): void {
    // No permitir editar ítems si es nota de rechazo
    if (this.esNotaRechazoComputed) {
      this.notificacionService.openAlgoSalioMal('No se pueden editar ítems de una nota de rechazo');
      return;
    }
    
    // Abrir diálogo de edición
    const dialogRef = this.dialog.open(EditNotaRecepcionItemDialogComponent, {
      width: '70%',
      height: '70%',
      data: {
        item: item,
        notaRecepcionId: this.data.nota?.id || 0
      },
      disableClose: true
    });

    // Manejar resultado del diálogo
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.notificacionService.openSucess('Ítem actualizado exitosamente');
        // Marcar que se hicieron cambios (esto puede afectar el estado de la nota)
        this.changesMade = true;
        // Recargar la tabla de ítems
        this.loadItems();
      }
    });
  }

  onDeleteItem(item: NotaRecepcionItem): void {
    // Mostrar confirmación antes de eliminar (usando patrón simple)
    this.dialogosService.confirm(
      'Eliminar Ítem',
      `¿Está seguro de que desea eliminar el ítem "${item.producto?.descripcion || 'Producto'}"?`
    ).subscribe(confirmed => {
      if (confirmed) {
        this.deleteItem(item);
      }
    });
  }

  private deleteItem(item: NotaRecepcionItem): void {
    if (!item.id) {
      this.notificacionService.openAlgoSalioMal('No se puede eliminar un ítem sin ID');
      return;
    }

    // Llamar servicio para eliminar
    this.pedidoService.onDeleteNotaRecepcionItem(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.notificacionService.openSucess('Ítem eliminado exitosamente');
            // Marcar que se hicieron cambios
            this.changesMade = true;
            // Recargar la tabla de ítems
            this.loadItems();
          } else {
            this.notificacionService.openAlgoSalioMal('No se pudo eliminar el ítem');
          }
        },
        error: (error) => {
          console.error('Error al eliminar ítem:', error);
          this.notificacionService.openAlgoSalioMal('Error al eliminar el ítem');
        }
      });
  }

  onDistributeItem(item: NotaRecepcionItem): void {
    // No permitir distribuir ítems si es nota de rechazo
    if (this.esNotaRechazoComputed) {
      this.notificacionService.openAlgoSalioMal('No se pueden distribuir ítems de una nota de rechazo');
      return;
    }
    
    // Verificar que el ítem tenga ID (esté guardado)
    if (!item.id) {
      this.notificacionService.openAlgoSalioMal('Debe guardar el ítem antes de poder distribuirlo');
      return;
    }

    // Cargar las distribuciones existentes del ítem
    this.pedidoService.onGetNotaRecepcionItemDistribucionesByNotaRecepcionItemId(item.id).subscribe({
      next: (distribuciones) => {
        // Cargar las sucursales del pedido
        const sucursalesInfluencia = this.data.pedido?.sucursalInfluenciaList?.map(psi => psi.sucursal) || [];
        const sucursalesEntrega = this.data.pedido?.sucursalEntregaList?.map(pse => pse.sucursal) || [];

        // Abrir el diálogo de distribución
        const dialogRef = this.dialog.open(DistributeNotaRecepcionItemDialogComponent, {
          width: '80%',
          height: '80%',
          data: {
            item: item,
            distribuciones: distribuciones,
            sucursalesInfluencia: sucursalesInfluencia,
            sucursalesEntrega: sucursalesEntrega,
            title: `Distribuir: ${item.producto.descripcion}`
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result && result.success) {
            this.notificacionService.openSucess(result.message || 'Distribución actualizada correctamente');
            // Marcar que se hicieron cambios (esto actualiza el estado de la nota en el backend)
            this.changesMade = true;
            // Recargar los ítems para actualizar el estado de distribución
            // Usar setTimeout para dar tiempo al backend a actualizar el estado
            setTimeout(() => {
              this.loadItems();
            }, 500);
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar distribuciones:', error);
        this.notificacionService.openAlgoSalioMal('Error al cargar las distribuciones: ' + error.message);
      }
    });
  }

  onRechazarItem(item: NotaRecepcionItem): void {
    // No permitir rechazar ítems si es nota de rechazo
    if (this.esNotaRechazoComputed) {
      this.notificacionService.openAlgoSalioMal('No se pueden rechazar ítems de una nota de rechazo');
      return;
    }
    
    // Verificar que el ítem tenga ID (esté guardado)
    if (!item.id) {
      this.notificacionService.openAlgoSalioMal('Debe guardar el ítem antes de poder rechazarlo');
      return;
    }

    // Verificar si el ítem ya está rechazado
    if (item.estado === 'RECHAZADO') {
      this.notificacionService.openAlgoSalioMal('Este ítem ya está rechazado');
      return;
    }

    // Para rechazar desde nota de recepción, usamos la cantidad completa del ítem
    const cantidadDisponible = item.cantidadEnNota || 0;
    
    if (cantidadDisponible <= 0) {
      this.notificacionService.openAlgoSalioMal('No hay cantidad disponible para rechazar en este ítem');
      return;
    }

    // Crear un PedidoItem temporal para el diálogo de rechazo
    const pedidoItemTemporal = {
      id: item.pedidoItem?.id || 0,
      producto: item.producto,
      presentacionCreacion: item.presentacionEnNota,
      cantidadSolicitada: item.cantidadEnNota || 0,
      cantidadPendiente: item.cantidadEnNota || 0, // Usar la cantidad completa del ítem
      precioUnitarioSolicitado: item.precioUnitarioEnNota || 0,
      vencimientoEsperado: item.vencimientoEnNota,
      esBonificacion: item.esBonificacion || false,
      pedido: this.data.pedido
    } as any;

    // Usar el diálogo específico de rechazo con la nota preseleccionada
    const dialogRef = this.dialog.open(RechazarItemDialogComponent, {
      width: '60%',
      data: {
        pedidoItem: pedidoItemTemporal,
        notasDisponibles: [this.data.nota], // Solo la nota actual
        pedidoId: this.data.pedido?.id || 0,
        notaPreseleccionada: this.data.nota?.id || 0, // Nota preseleccionada
        cantidadMaxima: cantidadDisponible, // Cantidad máxima que se puede rechazar
        itemToReject: item // Ítem específico a rechazar
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.notificacionService.openSucess(result.message || 'Ítem rechazado exitosamente');
        // Marcar que se hicieron cambios
        this.changesMade = true;
        // Recargar la tabla de ítems
        this.loadItems();
      }
    });
  }

  private saveFormSnapshot(): void {
    this.notaFormSnapshot = this.notaRecepcionForm.getRawValue();
    this.notaRecepcionForm.markAsPristine();
    this.actualizarEstadoAcciones();
  }

  private revertirFormulario(): void {
    if (this.notaFormSnapshot) {
      this.notaRecepcionForm.patchValue(this.notaFormSnapshot);
      this.notaRecepcionForm.markAsPristine();
      this.updateComputedProperties();
    }
  }

  onSalir(): void {
    if (!this.hayCambiosPendientes) {
      this.cerrarDialogo();
      return;
    }

    const cantidadItems = this.itemsAgregadosEnSesion.length;
    const encabezadoModificado = this.notaRecepcionForm.dirty;
    let mensaje: string;

    if (cantidadItems > 0 && encabezadoModificado) {
      mensaje = 'Hay ítems agregados sin confirmar y cambios en el encabezado sin guardar. '
        + 'Si sale ahora, los productos no se cargarán y se perderán los datos. ¿Desea salir de todas formas?';
    } else if (cantidadItems > 0) {
      mensaje = `Hay ${cantidadItems} ítem(s) agregado(s) sin confirmar con Actualizar. `
        + 'Si sale ahora, esos productos no se cargarán en la nota. ¿Desea salir de todas formas?';
    } else {
      mensaje = 'Hay cambios en el encabezado sin guardar. '
        + 'Si sale ahora, se perderán los datos. ¿Desea salir de todas formas?';
    }

    this.dialogosService.confirm(
      'Confirmar salida',
      mensaje,
      undefined,
      undefined,
      true,
      'Salir',
      'Permanecer'
    ).pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.limpiarCambiosPendientesYcerrar();
        }
      });
  }

  private limpiarCambiosPendientesYcerrar(): void {
    const idsAEliminar = [...this.itemsAgregadosEnSesion];

    if (idsAEliminar.length === 0) {
      this.cerrarDialogo();
      return;
    }

    this.deletingNota = true;
    this.actualizarEstadoAcciones();
    this.cdr.markForCheck();

    const eliminaciones = idsAEliminar.map(id =>
      this.pedidoService.onDeleteNotaRecepcionItem(id)
    );

    forkJoin(eliminaciones)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultados) => {
          const huboError = resultados.some(success => !success);
          this.itemsAgregadosEnSesion = [];
          this.deletingNota = false;

          if (huboError) {
            this.notificacionService.openAlgoSalioMal('No se pudieron eliminar todos los ítems. No se cerró el diálogo.');
            this.actualizarEstadoAcciones();
            this.cdr.markForCheck();
            return;
          }

          this.changesMade = true;
          this.cerrarDialogo();
        },
        error: (error) => {
          console.error('Error al limpiar ítems antes de salir:', error);
          this.deletingNota = false;
          this.actualizarEstadoAcciones();
          this.cdr.markForCheck();
          this.notificacionService.openAlgoSalioMal('Error al limpiar ítems antes de salir');
        }
      });
  }

  private cerrarDialogo(): void {
    const result: AddEditNotaRecepcionDialogResult = {
      success: true,
      changesMade: this.changesMade,
      operation: this.changesMade ? 'updated' : 'no_changes',
      message: this.changesMade ?
        (this.autoAssignItems && this.selectedItemsToAssign.length > 0 ?
          `Nota creada y ${this.selectedItemsToAssign.length} ítems asignados exitosamente` :
          'Cambios realizados en la nota de recepción') :
        'No se realizaron cambios'
    };

    this.dialogRef.close(result);
  }

  onCancelar(): void {
    if (!this.initialIsEdit && this.notaCreada) {
      this.onCancelarCreacion();
      return;
    }
    if (this.initialIsEdit && this.hayCambiosPendientes) {
      this.onCancelarCambiosEdicion();
    }
  }

  private onCancelarCambiosEdicion(): void {
    const cantidadItems = this.itemsAgregadosEnSesion.length;
    const mensaje = cantidadItems > 0
      ? `¿Desea cancelar los cambios? Se eliminarán ${cantidadItems} ítem(s) agregado(s) y se revertirán los cambios del encabezado.`
      : '¿Desea cancelar los cambios del encabezado?';

    this.dialogosService.confirm('Cancelar Cambios', mensaje)
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (!confirmed) {
          return;
        }
        this.revertirCambiosPendientes();
      });
  }

  private revertirCambiosPendientes(): void {
    this.deletingNota = true;
    this.actualizarEstadoAcciones();
    this.cdr.markForCheck();
    const idsAEliminar = [...this.itemsAgregadosEnSesion];

    if (idsAEliminar.length === 0) {
      this.revertirFormulario();
      this.deletingNota = false;
      this.changesMade = false;
      this.actualizarEstadoAcciones();
      this.cdr.markForCheck();
      this.notificacionService.openSucess('Cambios cancelados');
      return;
    }

    const eliminaciones = idsAEliminar.map(id =>
      this.pedidoService.onDeleteNotaRecepcionItem(id)
    );

    forkJoin(eliminaciones)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultados) => {
          const huboError = resultados.some(success => !success);
          this.itemsAgregadosEnSesion = [];
          this.revertirFormulario();
          this.loadItems();
          this.deletingNota = false;
          this.changesMade = !huboError;
          this.updateComputedProperties();

          if (huboError) {
            this.notificacionService.openWarn('Algunos ítems no pudieron eliminarse');
          } else {
            this.notificacionService.openSucess('Cambios cancelados');
          }
        },
        error: (error) => {
          console.error('Error al cancelar cambios:', error);
          this.deletingNota = false;
          this.actualizarEstadoAcciones();
          this.cdr.markForCheck();
          this.notificacionService.openAlgoSalioMal('Error al cancelar los cambios');
        }
      });
  }

  private onCancelarCreacion(): void {
    if (this.initialIsEdit || !this.notaCreada || !this.data.nota?.id) {
      return;
    }

    const numeroNota = this.data.nota.numero;
    this.dialogosService.confirm(
      'Cancelar Creación',
      `¿Está seguro de cancelar la creación de la nota ${numeroNota}? Se eliminará la nota y todos sus ítems.`
    ).pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (!confirmed) {
          return;
        }

        this.deletingNota = true;
        this.actualizarEstadoAcciones();
        this.cdr.markForCheck();
        this.pedidoService.onDeleteNotaRecepcion(this.data.nota!.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (success) => {
              this.deletingNota = false;
              if (success) {
                this.changesMade = true;
                this.notificacionService.openSucess('Creación de nota cancelada');
                this.reiniciarDespuesCancelarCreacion();
              } else {
                this.actualizarEstadoAcciones();
                this.cdr.markForCheck();
                this.notificacionService.openAlgoSalioMal('No se pudo cancelar la creación de la nota');
              }
            },
            error: (error) => {
              console.error('Error al cancelar creación de nota:', error);
              this.deletingNota = false;
              this.actualizarEstadoAcciones();
              this.cdr.markForCheck();
              this.notificacionService.openAlgoSalioMal('Error al cancelar la creación de la nota');
            }
          });
      });
  }

  private reiniciarDespuesCancelarCreacion(): void {
    this.notaCreada = false;
    this.data.nota = undefined;
    this.data.isEdit = false;
    this.itemsAgregadosEnSesion = [];
    this.notaFormSnapshot = null;

    if (this.autoAssignItems && this.selectedItemsToAssign.length > 0) {
      this.dialogTitle = `Nueva Nota de Recepción (${this.selectedItemsToAssign.length} ítems seleccionados)`;
    } else {
      this.dialogTitle = 'Nueva Nota de Recepción';
    }
    this.actionButtonText = 'Crear';

    const pedidoMonedaId = this.data.pedido?.moneda?.id;
    const monedaPedido = pedidoMonedaId ? this.monedas.find(m => m.id === pedidoMonedaId) : null;
    const monedaDefault = monedaPedido || this.monedas[0];

    this.notaRecepcionForm.reset({
      numero: '',
      timbrado: '',
      tipoBoleta: TipoBoleta.FACTURA,
      fecha: new Date(),
      moneda: monedaDefault,
      cotizacion: 1,
      estado: NotaRecepcionEstado.PENDIENTE_CONCILIACION,
      pagado: false
    });
    this.notaRecepcionForm.markAsPristine();
    this.notaRecepcionForm.enable();

    if (monedaDefault?.denominacion !== 'GUARANI' && this.data.pedido?.cotizacion) {
      this.notaRecepcionForm.patchValue({ cotizacion: this.data.pedido.cotizacion });
    } else if (monedaDefault?.denominacion !== 'GUARANI') {
      this.loadCotizacionFromCambio(monedaDefault?.id);
    }

    this.itemsDataSource.data = [];
    this.updateComputedProperties();

    setTimeout(() => {
      if (this.numeroInput?.nativeElement) {
        this.numeroInput.nativeElement.focus();
      }
    }, 100);
  }

  async onSave(): Promise<void> {
    // No permitir guardar si es nota de rechazo
    if (this.esNotaRechazoComputed) {
      this.notificacionService.openAlgoSalioMal('Las notas de rechazo no son editables');
      return;
    }
    
    if (this.notaRecepcionForm.valid) {
      const formValue = this.notaRecepcionForm.value;
      
      // Limpiar y convertir datos del formulario
      const cleanFormValue = this.cleanFormData(formValue);
      
      // Validar nota duplicada antes de guardar
      const proveedorId = this.data.pedido?.proveedor?.id;
      const numero = Number(cleanFormValue.numero);
      const notaId = this.data.isEdit && this.data.nota ? this.data.nota.id : undefined;
      
      if (proveedorId && numero) {
        const puedeContinuar = await this.validarNotaDuplicada(numero, proveedorId, notaId);
        if (!puedeContinuar) {
          return; // Usuario canceló o no quiere continuar
        }
      }
      
      this.savingNota = true;
      this.actualizarEstadoAcciones();
      this.cdr.markForCheck();

      if (this.data.isEdit && this.data.nota) {
        // Edit existing nota
        const nota = Object.assign(new NotaRecepcion(), this.data.nota);
        
        // Update editable properties from form with proper type conversions
        nota.numero = Number(cleanFormValue.numero);
        nota.timbrado = cleanFormValue.timbrado ? Number(cleanFormValue.timbrado) : null;
        nota.tipoBoleta = cleanFormValue.tipoBoleta;
        nota.fecha = cleanFormValue.fecha;
        nota.moneda = cleanFormValue.moneda;
        nota.cotizacion = Number(cleanFormValue.cotizacion);
        
        // Convertir a input para el backend
        const notaInput = nota.toInput();
        
        // Llamar servicio real para actualizar
        this.pedidoService.onSaveNotaRecepcion(notaInput)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (notaActualizada) => {
              this.savingNota = false;
              
              // Actualizar datos con la nota actualizada
              this.data.nota = notaActualizada;

              this.changesMade = true;
              this.itemsAgregadosEnSesion = [];
              this.saveFormSnapshot();

              this.loadItemsAfterCreation();
              
              this.notificacionService.openSucess('Nota de recepción actualizada exitosamente');
            },
            error: (error) => {
              console.error('Error al actualizar nota de recepción:', error);
              this.savingNota = false;
              this.actualizarEstadoAcciones();
              this.cdr.markForCheck();
              this.notificacionService.openAlgoSalioMal('Error al actualizar la nota de recepción');
            }
          });
        
      } else {
        // Create new nota
        const nota = new NotaRecepcion();
        
        // Set properties from form with proper type conversions
        nota.numero = Number(cleanFormValue.numero);
        nota.timbrado = cleanFormValue.timbrado ? Number(cleanFormValue.timbrado) : null;
        nota.tipoBoleta = cleanFormValue.tipoBoleta;
        nota.fecha = cleanFormValue.fecha;
        nota.moneda = cleanFormValue.moneda;
        nota.cotizacion = Number(cleanFormValue.cotizacion);
        nota.pedido = this.data.pedido!;
        nota.creadoEn = new Date();
        nota.usuario = this.mainService.usuarioActual;
        nota.estado = NotaRecepcionEstado.PENDIENTE_CONCILIACION;
        nota.pagado = false;
        
        // Convertir a input para el backend
        const notaInput = nota.toInput();
        // Agregar flag assignAllItems si está activo
        if (this.assignAllItems) {
          notaInput.assignAllItems = true;
        }
        
        // Llamar servicio real para crear
        this.pedidoService.onSaveNotaRecepcion(notaInput)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (notaCreada) => {
              this.savingNota = false;
              
              // En modo creación, no cerrar diálogo
              // Cambiar título y botón text
              this.dialogTitle = 'Editar Nota de Recepción';
              this.actionButtonText = 'Actualizar';
              this.notaCreada = true;
              
              // Actualizar datos con la nota creada
              this.data.nota = notaCreada;
              this.data.isEdit = true;

              this.changesMade = true;
              this.itemsAgregadosEnSesion = [];
              this.saveFormSnapshot();

              this.loadItemsAfterCreation();

              this.focusSalirButton();
              
              this.notificacionService.openSucess('Nota de recepción creada exitosamente');
            },
            error: (error) => {
              console.error('Error al crear nota de recepción:', error);
              this.savingNota = false;
              this.actualizarEstadoAcciones();
              this.cdr.markForCheck();
              this.notificacionService.openAlgoSalioMal('Error al crear la nota de recepción');
            }
          });
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.notaRecepcionForm.controls).forEach(key => {
        this.notaRecepcionForm.get(key)?.markAsTouched();
      });
      this.updateComputedProperties();
    }
  }

  private loadItemsAfterCreation(): void {
    // Recargar ítems después de crear la nota
    if (this.data.nota?.id) {
      this.pedidoService.onGetNotaRecepcionItemListPorNotaRecepcionId(this.data.nota.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (items: NotaRecepcionItem[]) => {
            this.itemsDataSource.data = items;
            this.updateComputedProperties();
            
            // Si hay ítems para asignar automáticamente, hacerlo ahora
            if (this.autoAssignItems && this.selectedItemsToAssign.length > 0) {
              this.assignSelectedItemsToNote();
            }
          },
          error: (error) => {
            console.error('Error al recargar ítems después de crear nota:', error);
            this.itemsDataSource.data = [];
            this.updateComputedProperties();
          }
        });
    } else {
      this.itemsDataSource.data = [];
      this.updateComputedProperties();
    }
  }

  /**
   * Asigna automáticamente los ítems seleccionados a la nota recién creada
   */
  private assignSelectedItemsToNote(): void {
    if (!this.data.nota?.id || this.selectedItemsToAssign.length === 0 || this.assigningItems) {
      return;
    }

    this.assigningItems = true;

    const pedidoItemIds = this.selectedItemsToAssign.map(item => item.id);

    const usuarioId = this.mainService.usuarioActual?.id;
    this.pedidoService.onAsignarItemsANota(this.data.nota.id, pedidoItemIds, usuarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.assigningItems = false;
          
          if (result.success) {
            // Recargar ítems para mostrar los nuevos ítems asignados
            this.loadItemsAfterAssignment();
            
            // Mostrar mensaje apropiado
            if (result.errores && result.errores.length > 0) {
              const errores = result.errores.map(e => `Ítem ${e.pedidoItemId}: ${e.error}`).join('\n');
              this.notificacionService.openWarn(`${result.message}\n\nErrores:\n${errores}`);
            } else {
              this.notificacionService.openSucess(result.message);
            }
          } else {
            this.notificacionService.openAlgoSalioMal(result.message);
          }
        },
        error: (error) => {
          this.assigningItems = false;
          console.error('Error al asignar ítems automáticamente:', error);
          this.notificacionService.openAlgoSalioMal('Error al asignar ítems automáticamente');
        }
      });
  }

  /**
   * Recarga los ítems después de la asignación automática
   */
  private loadItemsAfterAssignment(): void {
    if (this.data.nota?.id) {
      this.pedidoService.onGetNotaRecepcionItemListPorNotaRecepcionId(this.data.nota.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (items: NotaRecepcionItem[]) => {
            this.itemsDataSource.data = items;
            this.updateComputedProperties();
            
            // Marcar que se hicieron cambios
            this.changesMade = true;
          },
          error: (error) => {
            console.error('Error al recargar ítems después de asignación:', error);
            this.itemsDataSource.data = [];
            this.updateComputedProperties();
          }
        });
    }
  }

  private focusSalirButton(): void {
    // Dar foco al botón Salir después de crear
    setTimeout(() => {
      if (this.salirButton) {
        this.salirButton._elementRef.nativeElement.focus();
      }
    }, 100);
  }

  /**
   * Valida si existe una nota duplicada con el mismo número y proveedor
   * @param numero - Número de la nota
   * @param proveedorId - ID del proveedor
   * @param notaId - ID de la nota actual (opcional, para edición)
   * @returns Promise<boolean> - true si puede continuar, false si canceló
   */
  private async validarNotaDuplicada(numero: number, proveedorId: number, notaId?: number): Promise<boolean> {
    try {
      // Buscar notas existentes con mismo número y proveedor
      const notasExistentes = await this.pedidoService.onBuscarNotasPorProveedorYNumero(
        proveedorId,
        numero
      ).pipe(first()).toPromise();

      if (!notasExistentes || notasExistentes.length === 0) {
        return true; // No hay duplicados
      }

      // Filtrar la nota actual si estamos editando
      const otrasNotas = notaId
        ? notasExistentes.filter(n => n.id !== notaId)
        : notasExistentes;

      if (otrasNotas.length === 0) {
        return true; // Solo está la nota actual
      }

      // Mostrar advertencia con detalles
      const mensaje = this.construirMensajeAdvertencia(otrasNotas, numero);
      
      return await this.dialogosService.confirm(
        'Nota Duplicada Detectada',
        mensaje,
        '¿Desea continuar de todas formas?',
        undefined,
        true,
        'Continuar',
        'Cancelar'
      ).pipe(first()).toPromise() || false;
    } catch (error) {
      console.error('Error al validar nota duplicada:', error);
      // En caso de error, permitir continuar (no bloquear)
      return true;
    }
  }

  /**
   * Construye el mensaje de advertencia para notas duplicadas
   * @param notas - Lista de notas duplicadas
   * @param numero - Número de la nota
   * @returns Mensaje formateado
   */
  private construirMensajeAdvertencia(notas: NotaRecepcion[], numero: number): string {
    let mensaje = `Ya existen ${notas.length} nota(s) con el número ${numero} para este proveedor:\n\n`;
    
    notas.forEach((nota, index) => {
      mensaje += `${index + 1}. Pedido #${nota.pedido?.id || 'N/A'} - `;
      mensaje += `Fecha: ${this.formatDate(new Date(nota.fecha))} - `;
      mensaje += `Estado: ${nota.estado}`;
      if (nota.timbrado) {
        mensaje += ` - Timbrado: ${nota.timbrado}`;
      }
      mensaje += '\n';
    });
    
    mensaje += '\nSi el proveedor cambió de timbrado, esto es válido. ';
    mensaje += 'De lo contrario, verifique que no esté duplicando la nota.';
    
    return mensaje;
  }

  /**
   * Formatea una fecha para mostrar en la UI
   * @param date - Fecha a formatear
   * @returns String formateado
   */
  private formatDate(date: Date): string {
    if (!date) return '';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Limpia y convierte los datos del formulario a los tipos correctos
   * @param formValue - Valores del formulario
   * @returns Datos limpios con tipos correctos
   */
  private cleanFormData(formValue: any): any {
    return {
      numero: formValue.numero?.toString().trim() || '',
      timbrado: formValue.timbrado?.toString().trim() || '',
      tipoBoleta: formValue.tipoBoleta || '',
      fecha: formValue.fecha || new Date(),
      moneda: formValue.moneda || null,
      cotizacion: formValue.cotizacion?.toString().trim() || '0',
      estado: formValue.estado || NotaRecepcionEstado.PENDIENTE_CONCILIACION,
      pagado: formValue.pagado || false
    };
  }
}

/*
TODO: Implementar servicios del backend para NotaRecepcion

1. Crear/Actualizar NotaRecepcion:
   - Implementar servicio para guardar nueva nota de recepción
   - Implementar servicio para actualizar nota existente
   - Usar GenericCrudService con GraphQL mutations

2. Cargar ítems de NotaRecepcion:
   - Implementar servicio para cargar NotaRecepcionItem por notaId
   - Implementar servicio para cargar ítems después de crear nota
   - Usar GenericCrudService con GraphQL queries

3. CRUD de NotaRecepcionItem:
   - Implementar servicios para agregar, editar, eliminar ítems
   - Implementar diálogos para gestionar ítems individuales
   - Usar GenericCrudService con GraphQL mutations

4. Validaciones del backend:
   - Verificar que el número de nota sea único por pedido
   - Validar que la cotización sea mayor a 0
   - Validar que la fecha sea válida

5. Integración con pedido:
   - Actualizar estado del pedido cuando se crea/actualiza nota
   - Sincronizar con el flujo de recepción de mercadería
*/ 
