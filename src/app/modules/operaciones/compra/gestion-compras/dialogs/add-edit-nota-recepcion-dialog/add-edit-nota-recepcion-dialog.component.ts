import { Component, Inject, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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

export interface AddEditNotaRecepcionDialogData {
  nota?: NotaRecepcion;
  pedido?: Pedido;
  isEdit: boolean;
}

@Component({
  selector: 'app-add-edit-nota-recepcion-dialog',
  templateUrl: './add-edit-nota-recepcion-dialog.component.html',
  styleUrls: ['./add-edit-nota-recepcion-dialog.component.scss']
})
export class AddEditNotaRecepcionDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('guardarButton', { static: false }) guardarButton!: MatButton;
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
  displayedColumns: string[] = ['producto', 'presentacion', 'cantidad', 'precio', 'subtotal', 'vencimiento', 'acciones'];

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

  // Propiedades computadas para items (se actualizan cuando cambia itemsDataSource)
  computedItemsData: any[] = [];

  // Bandera para saber si ya se creó la nota
  private notaCreada: boolean = false;
  
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
    private notificacionService: NotificacionSnackbarService
  ) {
    this.dialogTitle = data.isEdit ? 'Editar Nota de Recepción' : 'Nueva Nota de Recepción';
    this.actionButtonText = data.isEdit ? 'Actualizar' : 'Crear';
    this.notaCreada = false;
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
  }

  private initializeForm(): void {
    console.log('data.nota', this.data.nota);
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
            console.log('Ítems de nota de recepción cargados:', items);
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
    console.log('Sistema de navegación por teclado configurado');
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
  }

  private updateItemsComputedData(): void {
    this.computedItemsData = this.itemsDataSource.data.map(item => ({
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
      rowColorClass: this.getRowColorClassInternal(item.estado)
    }));
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

  private getItemEstadoChipClassInternal(estado: NotaRecepcionItemEstado): string {
    switch (estado) {
      case NotaRecepcionItemEstado.CONCILIADO:
        return 'estado-activo';
      case NotaRecepcionItemEstado.RECHAZADO:
        return 'estado-cancelado';
      default:
        return 'estado-pendiente';
    }
  }

  private getItemEstadoDisplayNameInternal(estado: NotaRecepcionItemEstado): string {
    switch (estado) {
      case NotaRecepcionItemEstado.CONCILIADO:
        return 'Conciliado';
      case NotaRecepcionItemEstado.RECHAZADO:
        return 'Rechazado';
      default:
        return estado || '';
    }
  }

  private getRowColorClassInternal(estado: NotaRecepcionItemEstado): string {
    switch (estado) {
      case NotaRecepcionItemEstado.CONCILIADO:
        return 'row-conciliado';
      case NotaRecepcionItemEstado.RECHAZADO:
        return 'row-rechazado';
      default:
        return 'row-pendiente';
    }
  }

  // Métodos para manejo de ítems
  onAddItem(): void {
    // TODO: Implementar diálogo para agregar ítem
    console.log('Agregar ítem');
  }

  onEditItem(item: NotaRecepcionItem): void {
    // TODO: Implementar diálogo para editar ítem
    console.log('Editar ítem', item);
  }

  onDeleteItem(item: NotaRecepcionItem): void {
    // TODO: Implementar confirmación y eliminación
    console.log('Eliminar ítem', item);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
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
            console.log('Ítems recargados después de crear nota:', items);
            this.itemsDataSource.data = items;
            this.updateComputedProperties();
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

  private focusCancelButton(): void {
    // Dar foco al botón Cancelar después de crear
    setTimeout(() => {
      const cancelButton = document.querySelector('.cancel-button') as HTMLButtonElement;
      if (cancelButton) {
        cancelButton.focus();
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