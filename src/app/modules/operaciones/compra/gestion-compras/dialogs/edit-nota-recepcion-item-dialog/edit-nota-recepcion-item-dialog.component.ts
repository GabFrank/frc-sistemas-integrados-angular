import { Component, Inject, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SearchListDialogComponent } from '../../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { productoSearchPdv } from '../../../../../productos/producto/graphql/graphql-query';
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from '../../../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';

import { NotaRecepcionItem, NotaRecepcionItemEstado } from '../../nota-recepcion-item.model';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../../shared/components/dialogos/dialogos.service';
import { Presentacion } from '../../../../../productos/presentacion/presentacion.model';
import { Producto } from '../../../../../productos/producto/producto.model';
import { PedidoService } from '../../../pedido.service';
import { PresentacionService } from '../../../../../productos/presentacion/presentacion.service';
import { CurrencyMask } from '../../../../../../commons/core/utils/numbersUtils';

export interface EditNotaRecepcionItemDialogData {
  item?: NotaRecepcionItem; // Opcional para crear nuevos ítems
  notaRecepcionId: number;
  isNewItem?: boolean; // Flag para indicar si es un nuevo ítem
}

@Component({
  selector: 'app-edit-nota-recepcion-item-dialog',
  templateUrl: './edit-nota-recepcion-item-dialog.component.html',
  styleUrls: ['./edit-nota-recepcion-item-dialog.component.scss']
})
export class EditNotaRecepcionItemDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('guardarButton', { static: false }) guardarButton!: MatButton;
  @ViewChild('productoInput', { static: false }) productoInput!: any;
  @ViewChild('presentacionSelect', { static: false }) presentacionSelect!: any;
  @ViewChild('cantidadInput', { static: false }) cantidadInput!: any;
  @ViewChild('precioPorPresentacionInput', { static: false }) precioPorPresentacionInput!: any;
  @ViewChild('precioInput', { static: false }) precioInput!: any;
  @ViewChild('vencimientoInput', { static: false }) vencimientoInput!: any;

  itemForm: FormGroup;
  dialogTitle: string = 'Editar Ítem de Nota de Recepción';
  actionButtonText: string = 'Actualizar';
  isNewItem: boolean = false;
  
  // Estados disponibles
  estadosDisponibles = Object.values(NotaRecepcionItemEstado);
  // Referencia al enum para usar en el template
  NotaRecepcionItemEstado = NotaRecepcionItemEstado;

  // Datos del ítem original
  originalItem: NotaRecepcionItem;
  notaRecepcionId: number;
  
  // Datos originales del PedidoItem para comparación
  pedidoItemOriginal: any = null;
  
  // Propiedades computadas para evitar funciones en templates
  productoDisplayName: string = '';
  presentacionesDisponibles: Presentacion[] = [];
  selectedProducto: Producto | null = null;
  cantidadPorPresentacionComputed: number = 0;
  cantidadEnUnidadesBaseComputed: number = 0;
  subtotalComputed: number = 0;
  esBonificacionComputed: boolean = false;
  
  // Propiedades para detección de discrepancias
  hayDiscrepanciaComputed: boolean = false;
  discrepanciasDetectadasComputed: string[] = [];
  observacionRequiredError: boolean = false;
  observacionErrorMessage: string = '';
  isInitializing: boolean = true; // Flag para evitar detección durante inicialización
  
  // Error states para cada campo
  productoRequiredError: boolean = false;
  productoErrorMessage: string = '';
  
  presentacionRequiredError: boolean = false;
  presentacionErrorMessage: string = '';
  
  cantidadRequiredError: boolean = false;
  cantidadMinError: boolean = false;
  cantidadErrorMessage: string = '';
  
  precioRequiredError: boolean = false;
  precioMinError: boolean = false;
  precioErrorMessage: string = '';
  
  vencimientoRequiredError: boolean = false;
  vencimientoErrorMessage: string = '';
  
  motivoRechazoRequiredError: boolean = false;
  motivoRechazoErrorMessage: string = '';
  
  // Loading states
  loading = false;
  saving = false;
  
  // Estados para manejo de selects en navegación
  presentacionSelectOpen = false;
  estadoSelectOpen = false;
  
  // Currency mask para campos de precio
  currencyMask = new CurrencyMask();
  
  // Subject para manejo de memoria
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<EditNotaRecepcionItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditNotaRecepcionItemDialogData,
    private formBuilder: FormBuilder,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private presentacionService: PresentacionService,
    private matDialog: MatDialog,
  ) {
    this.isNewItem = this.data.isNewItem || false;
    this.notaRecepcionId = this.data.notaRecepcionId;
    
    if (this.isNewItem) {
      // Crear nuevo ítem
      this.originalItem = new NotaRecepcionItem();
      this.originalItem.notaRecepcion = { id: this.notaRecepcionId } as any;
      this.dialogTitle = 'Agregar Nuevo Ítem a Nota de Recepción';
      this.actionButtonText = 'Agregar';
    } else {
      // Editar ítem existente
      this.originalItem = Object.assign(new NotaRecepcionItem(), this.data.item);
      this.dialogTitle = 'Editar Ítem de Nota de Recepción';
      this.actionButtonText = 'Actualizar';
      
      // Guardar datos originales del PedidoItem para comparación (solo para edición)
      if (this.originalItem.pedidoItem) {
        this.pedidoItemOriginal = {
          cantidadSolicitada: this.originalItem.pedidoItem.cantidadSolicitada,
          precioUnitarioSolicitado: this.originalItem.pedidoItem.precioUnitarioSolicitado,
          presentacionCreacion: this.originalItem.pedidoItem.presentacionCreacion,
          esBonificacion: this.originalItem.pedidoItem.esBonificacion
        };
      }
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.initializePresentaciones();
    this.updateComputedProperties();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.setupKeyboardNavigation();
  }

  private initializeForm(): void {
    this.itemForm = this.formBuilder.group({
      searchProducto: [''],
      producto: [this.originalItem.producto || null, [Validators.required]],
      presentacion: [this.originalItem.presentacionEnNota || null, [Validators.required]],
      cantidadPorPresentacion: [this.calculateCantidadPorPresentacion(), [Validators.required, Validators.min(0.01)]],
      cantidadEnNota: [this.originalItem.cantidadEnNota || 0, [Validators.required, Validators.min(0.01)]],
      precioUnitario: [this.originalItem.precioUnitarioEnNota || 0, [Validators.required, Validators.min(0)]],
      precioPorPresentacion: [this.calculatePrecioPorPresentacion(), [Validators.min(0)]],
      vencimiento: [this.originalItem.vencimientoEnNota || null],
      estado: [this.originalItem.estado || NotaRecepcionItemEstado.PENDIENTE_CONCILIACION],
      motivoRechazo: [this.originalItem.motivoRechazo || ''],
      observaciones: [this.originalItem.observacion || ''],
      esBonificacion: [this.originalItem.esBonificacion || false]
    });

    // Configurar validación condicional para motivoRechazo
    this.itemForm.get('estado')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(estado => {
        const motivoRechazoControl = this.itemForm.get('motivoRechazo');
        if (estado === NotaRecepcionItemEstado.RECHAZADO) {
          motivoRechazoControl?.setValidators([Validators.required]);
        } else {
          motivoRechazoControl?.clearValidators();
        }
        motivoRechazoControl?.updateValueAndValidity();
        this.updateComputedProperties();
      });

    // Configurar validación condicional para precio cuando es bonificación
    this.itemForm.get('esBonificacion')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(esBonificacion => {
        const precioControl = this.itemForm.get('precioUnitario');
        if (esBonificacion) {
          precioControl?.setValue(0);
          precioControl?.disable();
        } else {
          precioControl?.enable();
        }
        this.updateComputedProperties();
      });

    // Configurar cálculo automático de cantidad en unidades base
    this.itemForm.get('cantidadPorPresentacion')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateComputedProperties();
      });

    // Configurar detección de discrepancias DESPUÉS de que el formulario esté completamente inicializado
    // Solo para ítems existentes (no para nuevos ítems)
    if (!this.isNewItem) {
      setTimeout(() => {
        this.isInitializing = false; // Marcar que la inicialización ha terminado
        this.setupDiscrepancyDetection();
        // Ejecutar detección inicial de discrepancias
        this.detectDiscrepancies();
      }, 200);
    } else {
      // Para nuevos ítems, solo marcar como no inicializando
      setTimeout(() => {
        this.isInitializing = false;
      }, 200);
    }

    this.itemForm.get('precioUnitario')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateComputedProperties();
      });

    this.itemForm.get('presentacion')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateComputedProperties();
      });

    // Configurar navegación por teclado
    this.setupFormValueChanges();
  }

  private calculateCantidadPorPresentacion(): number {
    if (this.originalItem.presentacionEnNota && this.originalItem.presentacionEnNota.cantidad > 0) {
      return (this.originalItem.cantidadEnNota || 0) / this.originalItem.presentacionEnNota.cantidad;
    }
    return this.originalItem.cantidadEnNota || 0;
  }

  private calculatePrecioPorPresentacion(): number {
    if (this.originalItem.presentacionEnNota && this.originalItem.presentacionEnNota.cantidad > 0) {
      return (this.originalItem.precioUnitarioEnNota || 0) * this.originalItem.presentacionEnNota.cantidad;
    }
    return this.originalItem.precioUnitarioEnNota || 0;
  }

  private updateCantidadBase(cantidadPorPresentacion: number): void {
    const presentacion = this.itemForm.get('presentacion')?.value;
    if (presentacion && presentacion.cantidad > 0) {
      const cantidadEnUnidadesBase = cantidadPorPresentacion * presentacion.cantidad;
      this.itemForm.get('cantidadEnNota')?.setValue(cantidadEnUnidadesBase, { emitEvent: false });
    } else {
      this.itemForm.get('cantidadEnNota')?.setValue(cantidadPorPresentacion, { emitEvent: false });
    }
  }

  private updatePrecioPorPresentacionFromUnitario(precioUnitario: number): void {
    if (this.esBonificacionComputed) return;

    const presentacion = this.itemForm.get('presentacion')?.value;
    if (presentacion && presentacion.cantidad) {
      const precioPorPresentacion = precioUnitario * presentacion.cantidad;
      this.itemForm.get('precioPorPresentacion')?.setValue(precioPorPresentacion, { emitEvent: false });
    }
  }

  private updatePrecioUnitarioFromPresentacion(precioPorPresentacion: number): void {
    if (this.esBonificacionComputed) return;

    const presentacion = this.itemForm.get('presentacion')?.value;
    if (presentacion && presentacion.cantidad > 0) {
      const precioUnitario = precioPorPresentacion / presentacion.cantidad;
      this.itemForm.get('precioUnitario')?.setValue(precioUnitario, { emitEvent: false });
    }
  }

  private updatePricesOnPresentacionChange(): void {
    // Cuando cambia la presentación, recalcular el precio por presentación basándose en el precio unitario actual
    const precioUnitario = this.itemForm.get('precioUnitario')?.value || 0;
    this.updatePrecioPorPresentacionFromUnitario(precioUnitario);
  }

  private setupDiscrepancyDetection(): void {
    // Detectar discrepancias cuando cambian los valores principales
    this.itemForm.get('cantidadPorPresentacion')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.detectDiscrepancies();
      });

    this.itemForm.get('precioUnitario')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.detectDiscrepancies();
      });

    this.itemForm.get('presentacion')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.detectDiscrepancies();
      });

    this.itemForm.get('esBonificacion')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.detectDiscrepancies();
      });
  }

  private detectDiscrepancies(): void {
    if (!this.pedidoItemOriginal || this.isInitializing) return;

    const formValue = this.itemForm.value;
    const discrepancias: string[] = [];

    // Comparar cantidad
    const cantidadOriginal = this.pedidoItemOriginal.cantidadSolicitada;
    const cantidadActual = formValue.cantidadEnNota;
    if (Math.abs(cantidadActual - cantidadOriginal) > 0.001) {
      discrepancias.push(`Cantidad: ${cantidadOriginal} → ${cantidadActual}`);
    }

    // Comparar precio (solo si no es bonificación)
    if (!formValue.esBonificacion) {
      const precioOriginal = this.pedidoItemOriginal.precioUnitarioSolicitado;
      const precioActual = formValue.precioUnitario;
      if (Math.abs(precioActual - precioOriginal) > 0.001) {
        discrepancias.push(`Precio: ${precioOriginal} → ${precioActual}`);
      }
    }

    // Comparar presentación (solo si ambas presentaciones existen)
    console.log('presentacionOriginal', this.pedidoItemOriginal.presentacionCreacion);
    console.log('presentacionActual', formValue.presentacion);
    const presentacionOriginal = this.pedidoItemOriginal.presentacionCreacion;
    const presentacionActual = formValue.presentacion;
    
    if (presentacionOriginal && presentacionActual) {
      if (presentacionOriginal.id !== presentacionActual.id) {
        discrepancias.push(`Presentación: ${presentacionOriginal.descripcion} → ${presentacionActual.descripcion}`);
      }
    } else if (presentacionOriginal && !presentacionActual) {
      discrepancias.push(`Presentación: ${presentacionOriginal.descripcion} → Sin presentación`);
    } else if (!presentacionOriginal && presentacionActual) {
      discrepancias.push(`Presentación: Sin presentación → ${presentacionActual.descripcion}`);
    }

    // Comparar bonificación (solo si realmente hay diferencia)
    const bonificacionOriginal = this.pedidoItemOriginal.esBonificacion ? true: false;
    const bonificacionActual = formValue.esBonificacion ? true : false;
    if (bonificacionOriginal !== bonificacionActual) {
      discrepancias.push(`Bonificación: ${bonificacionOriginal ? 'Sí' : 'No'} → ${bonificacionActual ? 'Sí' : 'No'}`);
    }

    // Actualizar propiedades computadas
    this.hayDiscrepanciaComputed = discrepancias.length > 0;
    this.discrepanciasDetectadasComputed = discrepancias;

    // NO cambiar el estado automáticamente - mantener el estado original
    // Las discrepancias se muestran como información visual, no como cambio de estado

    // Configurar validación condicional para observación
    this.setupObservacionValidation();
  }

  private setupObservacionValidation(): void {
    const observacionControl = this.itemForm.get('observaciones');
    const estadoControl = this.itemForm.get('estado');
    
    // Observación es obligatoria si hay discrepancias O si está rechazado
    if (this.hayDiscrepanciaComputed || estadoControl?.value === NotaRecepcionItemEstado.RECHAZADO) {
      observacionControl?.setValidators([Validators.required]);
      observacionControl?.updateValueAndValidity();
    } else {
      observacionControl?.clearValidators();
      observacionControl?.updateValueAndValidity();
    }
  }

  private initializePresentaciones(): void {
    // Solo cargar presentaciones si hay un producto seleccionado
    if (this.originalItem.producto && this.originalItem.producto.id) {
      this.presentacionService.onGetPresentacionesPorProductoId(this.originalItem.producto.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((presentaciones) => {
          this.presentacionesDisponibles = presentaciones;
          console.log('presentaciones', this.presentacionesDisponibles);
          console.log('originalItem', this.originalItem);
          
          // Solo establecer presentación si existe y no es un nuevo ítem
          if (!this.isNewItem && this.originalItem.presentacionEnNota) {
            this.itemForm.get('presentacion')?.setValue(this.presentacionesDisponibles.find(p => p.id === this.originalItem.presentacionEnNota.id));
          }
          console.log('presentacion', this.itemForm.get('presentacion')?.value);
        });
    }
  }

  private setupKeyboardNavigation(): void {
    // Sistema de navegación por teclado
  }

  private setupFormValueChanges(): void {
    // Configurar navegación automática entre campos
    this.itemForm.get('producto')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateComputedProperties();
      });

    // Configurar reactividad entre campos de precio
    this.itemForm.get('precioUnitario')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((precioUnitario) => {
        if (!this.esBonificacionComputed) {
          this.updatePrecioPorPresentacionFromUnitario(precioUnitario);
        }
        this.updateComputedProperties();
      });

    this.itemForm.get('precioPorPresentacion')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((precioPorPresentacion) => {
        if (!this.esBonificacionComputed) {
          this.updatePrecioUnitarioFromPresentacion(precioPorPresentacion);
        }
        this.updateComputedProperties();
      });

    // Configurar reactividad de presentación
    this.itemForm.get('presentacion')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updatePricesOnPresentacionChange();
        this.updateCantidadBase(this.itemForm.get('cantidadPorPresentacion')?.value || 1);
        this.updateComputedProperties();
      });

    // Configurar reactividad de cantidad
    this.itemForm.get('cantidadPorPresentacion')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((cantidad) => {
        this.updateCantidadBase(cantidad);
        this.updateComputedProperties();
      });
  }

  private focusNextField(fieldName: string, select?: boolean): void {
    switch (fieldName) {
      case 'presentacion':
        if (this.presentacionSelect) {
          this.presentacionSelect.focus();
        }
        break;
      case 'cantidad':
        if (this.cantidadInput) {
          if (select) { 
            // use select()
            this.presentacionSelect.select();
          }
          this.cantidadInput.nativeElement.focus();
        }
        break;
      case 'precioPorPresentacion':
        if (this.precioPorPresentacionInput) {
          if (select) {
            this.precioPorPresentacionInput.select();
          }
          this.precioPorPresentacionInput.nativeElement.focus();
        }
        break;
      case 'precio':
        if (this.precioInput) {
          if (select) {
            this.precioInput.select();
          }
          this.precioInput.nativeElement.focus();
        }
        break;
      case 'vencimiento':
        if (this.vencimientoInput) {
          if (select) {
            this.vencimientoInput.select();
          }
          this.vencimientoInput.nativeElement.focus();
        }
        break;
    }
  }

  // Métodos para manejar eventos de selects
  onPresentacionOpened(): void {
    this.presentacionSelectOpen = true;
  }

  onPresentacionClosed(): void {
    this.presentacionSelectOpen = false;
    // Si el campo es válido, navegar al siguiente
    const currentControl = this.itemForm.get('presentacion');
    if (currentControl && currentControl.valid) {
      setTimeout(() => {
        this.focusNextField('cantidad');
      }, 100);
    }
  }

  onPresentacionSelectionChange(): void {
    // Cuando se selecciona una opción, cerrar el select y navegar
    if (this.presentacionSelectOpen) {
      this.presentacionSelectOpen = false;
      setTimeout(() => {
        this.focusNextField('cantidad');
      }, 100);
    }
  }

  // Métodos para manejar keydown en inputs
  onCantidadKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.focusNextField('precioPorPresentacion');
    }
  }

  onPrecioPorPresentacionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.focusNextField('precio');
    }
  }

  onPrecioKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.focusNextField('vencimiento');
    }
  }

  onVencimientoKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.guardarButton) {
        this.guardarButton.focus();
      }
    }
  }

  onGuardarButtonKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSave();
    }
  }

  onBonificacionKeydown(event: KeyboardEvent): void {
    // Navegación por teclado para checkbox de bonificación
    if (event.key === 'Enter') {
      event.preventDefault();
      this.focusNextField('vencimiento');
    }
  }

  onObservacionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.guardarButton) {
        this.guardarButton.focus();
      }
    }
  }

  onCancelarKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onCancel();
    }
  }

  updateComputedProperties(): void {
    console.log('updateComputedProperties');
    this.updateErrorStates();
    this.updateItemComputedProperties();
  }

  private updateErrorStates(): void {
    const form = this.itemForm;
    
    // Producto
    const productoControl = form.get('producto');
    this.productoRequiredError = productoControl?.hasError('required') || false;
    this.productoErrorMessage = this.productoRequiredError ? 'El producto es requerido' : '';

    // Presentación
    const presentacionControl = form.get('presentacion');
    this.presentacionRequiredError = presentacionControl?.hasError('required') || false;
    this.presentacionErrorMessage = this.presentacionRequiredError ? 'La presentación es requerida' : '';

    // Cantidad
    const cantidadControl = form.get('cantidadPorPresentacion');
    this.cantidadRequiredError = cantidadControl?.hasError('required') || false;
    this.cantidadMinError = cantidadControl?.hasError('min') || false;
    this.cantidadErrorMessage = this.cantidadRequiredError ? 'La cantidad es requerida' : 
                               this.cantidadMinError ? 'La cantidad debe ser mayor a 0' : '';

    // Precio
    const precioControl = form.get('precioUnitario');
    this.precioRequiredError = precioControl?.hasError('required') || false;
    this.precioMinError = precioControl?.hasError('min') || false;
    this.precioErrorMessage = this.precioRequiredError ? 'El precio es requerido' : 
                             this.precioMinError ? 'El precio debe ser mayor o igual a 0' : '';

    // Vencimiento
    const vencimientoControl = form.get('vencimiento');
    this.vencimientoRequiredError = vencimientoControl?.hasError('required') || false;
    this.vencimientoErrorMessage = this.vencimientoRequiredError ? 'El vencimiento es requerido' : '';

    // Motivo de rechazo
    const motivoRechazoControl = form.get('motivoRechazo');
    this.motivoRechazoRequiredError = motivoRechazoControl?.hasError('required') || false;
    this.motivoRechazoErrorMessage = this.motivoRechazoRequiredError ? 'El motivo de rechazo es requerido' : '';

    // Observación (para discrepancias)
    const observacionControl = form.get('observaciones');
    this.observacionRequiredError = observacionControl?.hasError('required') || false;
    this.observacionErrorMessage = this.observacionRequiredError ? 'Las observaciones son requeridas para explicar las discrepancias' : '';
  }

  private updateItemComputedProperties(): void {
    const formValue = this.itemForm.value;
    
    // Producto display name
    this.productoDisplayName = formValue.producto?.descripcion || 'Sin producto';
    
    // Presentaciones disponibles, buscar en el servicio de presentaciones
    
    // Cantidad por presentación
    this.cantidadPorPresentacionComputed = formValue.cantidadPorPresentacion || 0;
    
    // Cantidad en unidades base
    const presentacion = formValue.presentacion;
    if (presentacion && presentacion.cantidad > 0) {
      this.cantidadEnUnidadesBaseComputed = this.cantidadPorPresentacionComputed * presentacion.cantidad;
    } else {
      this.cantidadEnUnidadesBaseComputed = this.cantidadPorPresentacionComputed;
    }
    
    // Subtotal
    this.subtotalComputed = this.cantidadEnUnidadesBaseComputed * (formValue.precioUnitario || 0);
    
    // Es bonificación
    this.esBonificacionComputed = formValue.esBonificacion || false;
  }

  onBuscarProducto(): void {
    // Implementar búsqueda de producto usando PdvSearchProductoDialogComponent
    const searchText = this.itemForm.get('searchProducto')?.value || '';

    const dialogData: PdvSearchProductoData = {
      texto: searchText,
      cantidad: 1,
      mostrarStock: false,
      conservarUltimaBusqueda: true,
    };

    const dialogRef = this.matDialog.open(PdvSearchProductoDialogComponent, {
      height: '80%',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result: PdvSearchProductoResponseData) => {
      if (result && result.producto && result.presentacion) {
        console.log('Producto seleccionado:', result);
        this.onProductoSelected(result.producto, result.presentacion);
      }
    });
  }

  onProductoSelected(producto: Producto, presentacion?: Presentacion): void {
    this.selectedProducto = producto;
    this.presentacionesDisponibles = producto.presentaciones || [];

    this.itemForm.patchValue({
      producto: producto,
      presentacion: presentacion || (this.presentacionesDisponibles.length > 0 ? this.presentacionesDisponibles[0] : null),
      precioUnitario: producto?.costo?.ultimoPrecioCompra || 0,
    });

    // mover foco al campo cantidad
    setTimeout(() => {
      this.focusNextField('cantidad');
    }, 100);

    this.updateComputedProperties();
    
    // Si no hay presentaciones en el producto, cargarlas desde el servicio
    if (!producto.presentaciones || producto.presentaciones.length === 0) {
      this.loadPresentacionesForProduct(producto);
    }
  }

  private loadPresentacionesForProduct(producto: Producto): void {
    if (producto && producto.id) {
      this.presentacionService.onGetPresentacionesPorProductoId(producto.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((presentaciones) => {
          this.presentacionesDisponibles = presentaciones;
          // Limpiar presentación seleccionada cuando cambia el producto
          this.itemForm.get('presentacion')?.setValue(null);
          this.updateComputedProperties();
        });
    }
  }

  onRemoverProducto(): void {
    this.selectedProducto = null;
    this.presentacionesDisponibles = [];
    this.itemForm.get('producto')?.setValue(null);
    this.itemForm.get('presentacion')?.setValue(null);
    this.updateComputedProperties();
  }

  displayProducto(producto: Producto): string {
    return producto ? `${producto.descripcion} (${producto.codigoPrincipal})` : '';
  }

  displayPresentacion(presentacion: Presentacion): string {
    return presentacion ? `${presentacion.descripcion} (${presentacion.cantidad} unid.)` : '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.itemForm.valid) {
      this.saving = true;
      
      const formValue = this.itemForm.value;
      
      // Crear objeto para guardar
      const itemToSave = Object.assign(new NotaRecepcionItem(), this.originalItem);
      
      // Actualizar propiedades del formulario
      itemToSave.producto = formValue.producto;
      itemToSave.presentacionEnNota = formValue.presentacion;
      itemToSave.cantidadEnNota = formValue.cantidadEnNota;
      itemToSave.precioUnitarioEnNota = formValue.precioUnitario;
      itemToSave.vencimientoEnNota = formValue.vencimiento;
      itemToSave.estado = formValue.estado;
      itemToSave.motivoRechazo = formValue.motivoRechazo;
      itemToSave.observacion = formValue.observaciones;
      itemToSave.esBonificacion = formValue.esBonificacion;
      
      // Asegurar que tenga la nota de recepción
      if (this.isNewItem) {
        itemToSave.notaRecepcion = { id: this.notaRecepcionId } as any;
      }
      
      // Convertir a input para el backend
      const itemInput = itemToSave.toInput();
      
      // Llamar servicio para guardar
      this.pedidoService.onSaveNotaRecepcionItem(itemInput)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (itemGuardado) => {
            this.saving = false;
            const mensaje = this.isNewItem ? 'Ítem agregado exitosamente' : 'Ítem actualizado exitosamente';
            this.notificacionService.openSucess(mensaje);
            this.dialogRef.close(itemGuardado);
          },
          error: (error) => {
            console.error('Error al guardar ítem:', error);
            this.saving = false;
            const mensaje = this.isNewItem ? 'Error al agregar el ítem' : 'Error al actualizar el ítem';
            this.notificacionService.openAlgoSalioMal(mensaje);
          }
        });
    } else {
      this.updateComputedProperties();
      this.notificacionService.openAlgoSalioMal('Por favor, complete todos los campos requeridos');
    }
  }
} 