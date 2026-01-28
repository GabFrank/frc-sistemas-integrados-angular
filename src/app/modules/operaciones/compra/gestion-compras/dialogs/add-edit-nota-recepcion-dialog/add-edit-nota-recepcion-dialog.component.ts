import { Component, Inject, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NotaRecepcion, NotaRecepcionEstado, TipoBoleta, NotaRecepcionInput } from '../../nota-recepcion.model';
import { NotaRecepcionItem, NotaRecepcionItemEstado } from '../../nota-recepcion-item.model';
import { Pedido } from '../../pedido.model';
import { Moneda } from '../../../../../financiero/moneda/moneda.model';
import { MonedaService } from '../../../../../financiero/moneda/moneda.service';
import { PedidoService } from '../../../pedido.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../../shared/components/dialogos/dialogos.service';
import { EditNotaRecepcionItemDialogComponent } from '../edit-nota-recepcion-item-dialog/edit-nota-recepcion-item-dialog.component';
import { RechazarItemDialogComponent } from '../rechazar-item-dialog/rechazar-item-dialog.component';
import { DistributeNotaRecepcionItemDialogComponent } from '../distribute-nota-recepcion-item-dialog/distribute-nota-recepcion-item-dialog.component';

export interface AddEditNotaRecepcionDialogData {
  nota?: NotaRecepcion;
  pedido?: Pedido;
  isEdit: boolean;
  // Nuevos campos para asignación automática de ítems
  selectedItemsToAssign?: any[]; // MockPedidoItem[] from parent component
  autoAssignItems?: boolean; // Flag para indicar si debe asignar ítems automáticamente
  assignAllItems?: boolean; // Flag para indicar que se deben asignar TODOS los items pendientes (independiente de la paginación)
}

export interface AddEditNotaRecepcionDialogResult {
  success: boolean;
  message?: string;
  changesMade: boolean;
  operation?: 'created' | 'updated' | 'deleted_item' | 'no_changes';
}

@Component({
  selector: 'app-add-edit-nota-recepcion-dialog',
  templateUrl: './add-edit-nota-recepcion-dialog.component.html',
  styleUrls: ['./add-edit-nota-recepcion-dialog.component.scss']
})
export class AddEditNotaRecepcionDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('guardarButton', { static: false }) guardarButton!: MatButton;
  @ViewChild('cancelButton', { static: false }) cancelButton!: MatButton;
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

  // Propiedades para asignación automática
  assignmentStatusText: string = '';
  assignmentStatusClass: string = '';
  showAssignmentStatus: boolean = false;

  // Bandera para saber si ya se creó la nota
  private notaCreada: boolean = false;
  
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
    private dialog: MatDialog
  ) {
    this.dialogTitle = data.isEdit ? 'Editar Nota de Recepción' : 'Nueva Nota de Recepción';
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
          
          // Si no hay moneda seleccionada, usar la primera disponible
          if (this.notaRecepcionForm && !this.notaRecepcionForm.get('moneda')?.value && monedas.length > 0) {
            this.notaRecepcionForm.patchValue({ moneda: monedas[0] });
          }
        },
        error: (error) => {
          console.error('Error al cargar monedas:', error);
          this.notificacionService.openAlgoSalioMal('Error al cargar las monedas');
          this.loadingMonedas = false;
        }
      });
  }

  ngOnInit(): void {
    this.loadMonedas();
    this.initializeForm();
    this.setupKeyboardNavigation();
    this.loadItems();
    this.updateComputedProperties();
    
    // Si es nota de rechazo, deshabilitar el formulario
    if (this.data.nota?.esNotaRechazo) {
      this.notaRecepcionForm.disable();
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
      if (this.notaRecepcionForm.valid) {
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
    // Actualizar error states
    this.updateErrorStates();
    
    // Actualizar propiedades del card informativo
    this.updateCardProperties();
    
    // Actualizar datos computados de items
    this.updateItemsComputedData();
    
    // Actualizar estado de asignación automática
    this.updateAssignmentStatus();
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
    
    // Monto total
    this.montoTotalComputed = this.itemsDataSource.data.reduce((total, item) => 
      total + (item.cantidadEnNota * item.precioUnitarioEnNota), 0);
    
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
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.notificacionService.openSucess('Ítem agregado exitosamente');
        // Marcar que se hicieron cambios (esto puede afectar el estado de la nota)
        this.changesMade = true;
        // Recargar la tabla de ítems
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

  onCancel(): void {
    // Devolver resultado indicando si se hicieron cambios
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

  onSave(): void {
    // No permitir guardar si es nota de rechazo
    if (this.esNotaRechazoComputed) {
      this.notificacionService.openAlgoSalioMal('Las notas de rechazo no son editables');
      return;
    }
    
    if (this.notaRecepcionForm.valid) {
      this.savingNota = true;
      const formValue = this.notaRecepcionForm.value;
      
      // Limpiar y convertir datos del formulario
      const cleanFormValue = this.cleanFormData(formValue);
      
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
              
              // Marcar que se hicieron cambios
              this.changesMade = true;
              
              // Recargar ítems después de actualizar
              this.loadItemsAfterCreation();
              
              this.notificacionService.openSucess('Nota de recepción actualizada exitosamente');
            },
            error: (error) => {
              console.error('Error al actualizar nota de recepción:', error);
              this.savingNota = false;
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
              
              // Marcar que se hicieron cambios
              this.changesMade = true;
              
              // Recargar ítems después de crear la nota
              this.loadItemsAfterCreation();
              
              // Dar foco al botón Cancelar
              this.focusCancelButton();
              
              this.notificacionService.openSucess('Nota de recepción creada exitosamente');
            },
            error: (error) => {
              console.error('Error al crear nota de recepción:', error);
              this.savingNota = false;
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

    this.pedidoService.onAsignarItemsANota(this.data.nota.id, pedidoItemIds)
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

  private focusCancelButton(): void {
    // Dar foco al botón Cancelar después de crear
    setTimeout(() => {
      if (this.cancelButton) {
        this.cancelButton._elementRef.nativeElement.focus();
      }
    }, 100);
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