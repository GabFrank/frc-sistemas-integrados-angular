import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  ComprasSearchProductoData,
  ComprasSearchProductoDialogComponent,
  ComprasSearchProductoResponse,
} from '../compras-search-producto-dialog/compras-search-producto-dialog.component';

import { NotaRecepcionItem, NotaRecepcionItemEstado } from '../../nota-recepcion-item.model';
import { NotaRecepcion } from '../../nota-recepcion.model';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { Presentacion } from '../../../../../productos/presentacion/presentacion.model';
import { Producto } from '../../../../../productos/producto/producto.model';
import { PedidoService } from '../../../pedido.service';
import { PresentacionService } from '../../../../../productos/presentacion/presentacion.service';
import { CurrencyMask } from '../../../../../../commons/core/utils/numbersUtils';
import { avisoTrasMutacion, erroresDeRechazo } from '../../../../../../commons/core/utils/graphqlErrorUtils';
import { AVISO_SIN_PRESENTACIONES } from '../../utils/recepcion-documental.utils';

export interface EditNotaRecepcionItemDialogData {
  item?: NotaRecepcionItem; // Opcional para crear nuevos ítems
  notaRecepcionId: number;
  isNewItem?: boolean; // Flag para indicar si es un nuevo ítem
  /**
   * Cotización de la nota respecto al guaraní. Necesaria para sugerir el costo del producto
   * en la moneda de la nota: `costo.ultimoPrecioCompra` viene siempre en Gs. En una nota nueva
   * `notaRecepcion` todavía llega con el id solo, así que la cotización la pasa el diálogo padre.
   */
  cotizacion?: number;
}

/**
 * Cierre tras un alta sin respuesta: el ítem pudo quedar guardado y reintentar lo agregaría otra vez, así que
 * quien abrió el diálogo recarga los ítems. `aviso` es el texto a mostrar (null si ya avisó el link) (#488).
 */
export interface ItemDeNotaSinConfirmar {
  recargar: true;
  aviso: string | null;
}

/** Lo que pidió el pedido, para marcar las discrepancias de la nota (solo al editar). */
interface PedidoItemOriginal {
  cantidadSolicitada: number;
  precioUnitarioSolicitado: number;
  presentacionCreacion: Presentacion | null;
  esBonificacion: boolean;
}

type CampoNavegable = 'presentacion' | 'cantidad' | 'precioPorPresentacion' | 'precio' | 'vencimiento';

/**
 * Alta o edición de un ítem de la nota de recepción. Un solo guardado (`saveNotaRecepcionItem`); el resto es
 * presentación: conversión de unidades y precios entre presentación y unidad, y aviso de discrepancias con el pedido.
 */
@UntilDestroy()
@Component({
  selector: 'app-edit-nota-recepcion-item-dialog',
  templateUrl: './edit-nota-recepcion-item-dialog.component.html',
  styleUrls: ['./edit-nota-recepcion-item-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditNotaRecepcionItemDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<EditNotaRecepcionItemDialogComponent, NotaRecepcionItem | ItemDeNotaSinConfirmar>>(MatDialogRef);
  data = inject<EditNotaRecepcionItemDialogData>(MAT_DIALOG_DATA);
  private formBuilder = inject(FormBuilder);
  private pedidoService = inject(PedidoService);
  private notificacionService = inject(NotificacionSnackbarService);
  private presentacionService = inject(PresentacionService);
  private matDialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('presentacionSelect') presentacionSelect?: MatSelect;
  @ViewChild('cantidadInput') cantidadInput?: ElementRef<HTMLInputElement>;
  @ViewChild('precioPorPresentacionInput') precioPorPresentacionInput?: ElementRef<HTMLInputElement>;
  @ViewChild('precioInput') precioInput?: ElementRef<HTMLInputElement>;
  @ViewChild('vencimientoInput') vencimientoInput?: ElementRef<HTMLInputElement>;

  itemForm: FormGroup;
  dialogTitle = 'Editar Ítem de Nota de Recepción';
  actionButtonText = 'Actualizar';
  isNewItem = false;

  // Datos del ítem original
  originalItem: NotaRecepcionItem;
  notaRecepcionId: number;

  // Datos originales del PedidoItem para comparación
  pedidoItemOriginal: PedidoItemOriginal | null = null;

  // Propiedades computadas para evitar funciones en templates
  productoDisplayName = '';
  presentacionesDisponibles: Presentacion[] = [];
  selectedProducto: Producto | null = null;
  cantidadPorPresentacionComputed = 0;
  cantidadEnUnidadesBaseComputed = 0;
  subtotalComputed = 0;
  esBonificacionComputed = false;
  mostrarProductoSeleccionado = false;
  productoSeleccionadoId: number | null = null;
  productoSeleccionadoDescripcion = '';
  productoSeleccionadoCodigo = '';
  tieneProducto = false;
  estadoActual = '';
  esRechazado = false;
  observacionLabel = 'Observaciones';
  observacionPlaceholder = 'Observaciones adicionales (opcional)';
  guardarDeshabilitado = true;
  textoBotonGuardar = 'Actualizar';

  // Propiedades para detección de discrepancias
  hayDiscrepanciaComputed = false;
  discrepanciasDetectadasComputed: string[] = [];
  observacionRequiredError = false;
  observacionErrorMessage = '';
  isInitializing = true; // Flag para evitar detección durante inicialización

  // Error states para cada campo
  productoRequiredError = false;
  productoErrorMessage = '';

  presentacionRequiredError = false;
  presentacionErrorMessage = '';

  cantidadRequiredError = false;
  cantidadMinError = false;
  cantidadErrorMessage = '';

  precioRequiredError = false;
  precioMinError = false;
  precioErrorMessage = '';

  vencimientoRequiredError = false;
  vencimientoErrorMessage = '';

  motivoRechazoRequiredError = false;
  motivoRechazoErrorMessage = '';

  // Loading states
  saving = false;

  // Estados para manejo de selects en navegación
  presentacionSelectOpen = false;

  // Currency mask para campos de precio
  currencyMask = new CurrencyMask();

  ngOnInit(): void {
    this.isNewItem = this.data.isNewItem || false;
    this.notaRecepcionId = this.data.notaRecepcionId;

    if (this.isNewItem) {
      // Crear nuevo ítem
      this.originalItem = new NotaRecepcionItem();
      this.originalItem.notaRecepcion = { id: this.notaRecepcionId } as NotaRecepcion;
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
          esBonificacion: this.originalItem.pedidoItem.esBonificacion,
        };
      }
    }

    this.initializeForm();
    this.initializePresentaciones();
    this.updateComputedProperties();
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
      esBonificacion: [this.originalItem.esBonificacion || false],
    });

    // Configurar validación condicional para motivoRechazo
    this.itemForm.get('estado')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((estado) => {
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
      .pipe(untilDestroyed(this))
      .subscribe((esBonificacion) => {
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
      .pipe(untilDestroyed(this))
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
        this.updateComputedProperties();
        this.cdr.markForCheck();
      }, 200);
    } else {
      // Para nuevos ítems, solo marcar como no inicializando
      setTimeout(() => {
        this.isInitializing = false;
      }, 200);
    }

    this.itemForm.get('precioUnitario')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
      });

    this.itemForm.get('presentacion')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
      });

    // Configurar navegación por teclado
    this.setupFormValueChanges();

    // Cualquier cambio (validez, dirty) actualiza lo que muestra el template. Va último: corre después de los
    // listeners de arriba, que ajustan validadores y valores derivados.
    this.itemForm.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
        this.cdr.markForCheck();
      });
    this.itemForm.statusChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
        this.cdr.markForCheck();
      });
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
    const presentacion: Presentacion | null = this.itemForm.get('presentacion')?.value;
    if (presentacion && presentacion.cantidad > 0) {
      const cantidadEnUnidadesBase = cantidadPorPresentacion * presentacion.cantidad;
      this.itemForm.get('cantidadEnNota')?.setValue(cantidadEnUnidadesBase, { emitEvent: false });
    } else {
      this.itemForm.get('cantidadEnNota')?.setValue(cantidadPorPresentacion, { emitEvent: false });
    }
  }

  private updatePrecioPorPresentacionFromUnitario(precioUnitario: number): void {
    if (this.esBonificacionComputed) return;

    const presentacion: Presentacion | null = this.itemForm.get('presentacion')?.value;
    if (presentacion && presentacion.cantidad) {
      const precioPorPresentacion = precioUnitario * presentacion.cantidad;
      this.itemForm.get('precioPorPresentacion')?.setValue(precioPorPresentacion, { emitEvent: false });
    }
  }

  private updatePrecioUnitarioFromPresentacion(precioPorPresentacion: number): void {
    if (this.esBonificacionComputed) return;

    const presentacion: Presentacion | null = this.itemForm.get('presentacion')?.value;
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
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.detectDiscrepancies();
      });

    this.itemForm.get('precioUnitario')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.detectDiscrepancies();
      });

    this.itemForm.get('presentacion')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.detectDiscrepancies();
      });

    this.itemForm.get('esBonificacion')?.valueChanges
      .pipe(untilDestroyed(this))
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

    // Comparar precio (solo si no es bonificación y misma moneda)
    // Si la nota tiene moneda distinta al pedido, la comparación numérica no tiene sentido
    const notaMonedaId = this.originalItem?.notaRecepcion?.moneda?.id;
    const pedidoMonedaId = this.originalItem?.pedidoItem?.pedido?.moneda?.id;
    const mismaCurrency = !notaMonedaId || !pedidoMonedaId || notaMonedaId === pedidoMonedaId;

    if (!formValue.esBonificacion && mismaCurrency) {
      const precioOriginal = this.pedidoItemOriginal.precioUnitarioSolicitado;
      const precioActual = formValue.precioUnitario;
      if (Math.abs(precioActual - precioOriginal) > 0.001) {
        discrepancias.push(`Precio: ${precioOriginal} → ${precioActual}`);
      }
    }

    // Comparar presentación (solo si ambas presentaciones existen)
    const presentacionOriginal = this.pedidoItemOriginal.presentacionCreacion;
    const presentacionActual: Presentacion | null = formValue.presentacion;

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
    const bonificacionOriginal = !!this.pedidoItemOriginal.esBonificacion;
    const bonificacionActual = !!formValue.esBonificacion;
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
    } else {
      observacionControl?.clearValidators();
    }
    observacionControl?.updateValueAndValidity();
  }

  private initializePresentaciones(): void {
    // Solo cargar presentaciones si hay un producto seleccionado
    if (this.originalItem.producto && this.originalItem.producto.id) {
      this.presentacionService.onGetPresentacionesPorProductoIdParaDialogo(this.originalItem.producto.id)
        .pipe(untilDestroyed(this))
        .subscribe({
          error: () => this.avisarPresentacionesSinCargar(),
          next: (presentaciones) => {
            if (presentaciones == null) {
              return; // Error GraphQL: el servicio ya avisó; queda la presentación original del ítem
            }
            this.presentacionesDisponibles = presentaciones;

            // Solo establecer presentación si existe y no es un nuevo ítem
            if (!this.isNewItem && this.originalItem.presentacionEnNota) {
              this.itemForm.get('presentacion')?.setValue(
                this.presentacionesDisponibles.find((p) => p.id === this.originalItem.presentacionEnNota.id)
              );
            }
            this.cdr.markForCheck();
          },
        });
    }
  }

  private setupFormValueChanges(): void {
    this.itemForm.get('producto')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
      });

    // Configurar reactividad entre campos de precio
    this.itemForm.get('precioUnitario')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((precioUnitario) => {
        if (!this.esBonificacionComputed) {
          this.updatePrecioPorPresentacionFromUnitario(precioUnitario);
        }
        this.updateComputedProperties();
      });

    this.itemForm.get('precioPorPresentacion')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((precioPorPresentacion) => {
        if (!this.esBonificacionComputed) {
          this.updatePrecioUnitarioFromPresentacion(precioPorPresentacion);
        }
        this.updateComputedProperties();
      });

    // Configurar reactividad de presentación
    this.itemForm.get('presentacion')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updatePricesOnPresentacionChange();
        this.updateCantidadBase(this.itemForm.get('cantidadPorPresentacion')?.value || 1);
        this.updateComputedProperties();
      });

    // Configurar reactividad de cantidad
    this.itemForm.get('cantidadPorPresentacion')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((cantidad) => {
        this.updateCantidadBase(cantidad);
        this.updateComputedProperties();
      });
  }

  private enfocarCampo(campo: CampoNavegable): void {
    switch (campo) {
      case 'presentacion':
        this.presentacionSelect?.focus();
        break;
      case 'cantidad':
        this.cantidadInput?.nativeElement.focus();
        break;
      case 'precioPorPresentacion':
        this.precioPorPresentacionInput?.nativeElement.focus();
        break;
      case 'precio':
        this.precioInput?.nativeElement.focus();
        break;
      case 'vencimiento':
        this.vencimientoInput?.nativeElement.focus();
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
        this.enfocarCampo('cantidad');
      }, 100);
    }
  }

  onPresentacionSelectionChange(): void {
    // Cuando se selecciona una opción, cerrar el select y navegar
    if (this.presentacionSelectOpen) {
      this.presentacionSelectOpen = false;
      setTimeout(() => {
        this.enfocarCampo('cantidad');
      }, 100);
    }
  }

  // Métodos para manejar keydown en inputs
  onCantidadKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.enfocarCampo('precioPorPresentacion');
    }
  }

  onCantidadFocus(): void {
    const cantidadControl = this.itemForm.get('cantidadPorPresentacion');
    const value = Number(cantidadControl?.value ?? 0);
    if (value === 0) {
      cantidadControl?.setValue(null);
    }
  }

  onPrecioPorPresentacionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.enfocarCampo('precio');
    }
  }

  onPrecioKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.enfocarCampo('vencimiento');
    }
  }

  // Enter en vencimiento y observaciones no pasa a «Guardar»: el @ViewChild('guardarButton') de antes nunca
  // encontraba el botón (#guardarBtn), así que solo se evita el Enter. Se conserva tal cual.
  onVencimientoKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
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
      this.enfocarCampo('vencimiento');
    }
  }

  onObservacionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
    }
  }

  onCancelarKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onCancel();
    }
  }

  updateComputedProperties(): void {
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
    const producto: Producto | null = formValue.producto;

    // Producto display name
    this.productoDisplayName = producto?.descripcion || 'Sin producto';
    this.mostrarProductoSeleccionado = !!this.productoDisplayName && !this.isNewItem;
    this.productoSeleccionadoId = producto?.id ?? null;
    this.productoSeleccionadoDescripcion = producto?.descripcion ?? '';
    this.productoSeleccionadoCodigo = producto?.codigoPrincipal ?? '';
    this.tieneProducto = !!producto;

    // Cantidad por presentación
    this.cantidadPorPresentacionComputed = formValue.cantidadPorPresentacion || 0;

    // Cantidad en unidades base
    const presentacion: Presentacion | null = formValue.presentacion;
    if (presentacion && presentacion.cantidad > 0) {
      this.cantidadEnUnidadesBaseComputed = this.cantidadPorPresentacionComputed * presentacion.cantidad;
    } else {
      this.cantidadEnUnidadesBaseComputed = this.cantidadPorPresentacionComputed;
    }

    // Subtotal
    this.subtotalComputed = this.cantidadEnUnidadesBaseComputed * (formValue.precioUnitario || 0);

    // Es bonificación
    this.esBonificacionComputed = formValue.esBonificacion || false;

    // Estado y observaciones
    this.estadoActual = this.itemForm.get('estado')?.value ?? '';
    this.esRechazado = this.estadoActual === NotaRecepcionItemEstado.RECHAZADO;
    this.observacionLabel = this.hayDiscrepanciaComputed ? 'Observaciones *' : 'Observaciones';
    this.observacionPlaceholder = this.hayDiscrepanciaComputed
      ? 'Explique el motivo de las discrepancias con el pedido original'
      : 'Observaciones adicionales (opcional)';

    this.guardarDeshabilitado = this.itemForm.invalid || this.saving || !this.itemForm.dirty;
    this.textoBotonGuardar = this.saving ? 'Guardando...' : this.actionButtonText;
  }

  onBuscarProducto(): void {
    const searchText = this.itemForm.get('searchProducto')?.value || '';

    const dialogData: ComprasSearchProductoData = {
      texto: searchText,
      mostrarStock: false,
    };

    const dialogRef = this.matDialog.open(ComprasSearchProductoDialogComponent, {
      height: '80%',
      data: dialogData,
    });

    dialogRef.afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((result: ComprasSearchProductoResponse) => {
        if (result && result.producto && result.presentacion) {
          this.onProductoSelected(result.producto, result.presentacion);
          this.cdr.markForCheck();
        }
      });
  }

  onProductoSelected(producto: Producto, presentacion?: Presentacion): void {
    this.selectedProducto = producto;
    this.presentacionesDisponibles = producto.presentaciones || [];
    const productoDisplay = producto ? `${producto.id} - ${producto.descripcion}` : '';

    this.itemForm.patchValue({
      searchProducto: productoDisplay,
      producto: producto,
      presentacion: presentacion || (this.presentacionesDisponibles.length > 0 ? this.presentacionesDisponibles[0] : null),
      precioUnitario: this.costoSugeridoEnMonedaNota(producto),
    });

    // mover foco al campo cantidad
    setTimeout(() => {
      this.enfocarCampo('cantidad');
    }, 100);

    this.updateComputedProperties();

    // Si no hay presentaciones en el producto, cargarlas desde el servicio
    if (!producto.presentaciones || producto.presentaciones.length === 0) {
      this.loadPresentacionesForProduct(producto);
    }
  }

  /**
   * Costo sugerido para el ítem, expresado en la moneda de la nota.
   *
   * `costo.ultimoPrecioCompra` se persiste SIEMPRE en guaraníes (ver
   * CostosPorProductoService.aplicarCostoCompra); la moneda/cotización del costo son solo
   * referencia de la compra original. Por eso si la nota está en moneda extranjera hay que
   * DIVIDIR por su cotización, nunca multiplicar por la del costo. Cargar el valor en Gs crudo
   * en una nota en US$/R$ inflaba el costo por la cotización al recepcionar, y ese costo inflado
   * volvía como sugerencia en la compra siguiente.
   */
  private costoSugeridoEnMonedaNota(producto: Producto): number {
    const costoEnGs = producto?.costo?.ultimoPrecioCompra || 0;
    const cotizacion = this.data.cotizacion
      ?? this.originalItem?.notaRecepcion?.cotizacion
      ?? 1;
    // cotizacion > 1 identifica a la moneda extranjera: el guaraní cotiza 1.
    if (costoEnGs > 0 && cotizacion > 1) {
      return Math.round((costoEnGs / cotizacion) * 100) / 100;
    }
    return costoEnGs;
  }

  private loadPresentacionesForProduct(producto: Producto): void {
    if (producto && producto.id) {
      this.presentacionService.onGetPresentacionesPorProductoIdParaDialogo(producto.id)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (presentaciones) => {
            // null = error GraphQL (el servicio ya avisó): sin presentación el formulario no es válido
            this.presentacionesDisponibles = presentaciones ?? [];
            // Limpiar presentación seleccionada cuando cambia el producto
            this.itemForm.get('presentacion')?.setValue(null);
            this.updateComputedProperties();
            this.cdr.markForCheck();
          },
          error: () => {
            this.presentacionesDisponibles = [];
            this.itemForm.get('presentacion')?.setValue(null);
            this.updateComputedProperties();
            this.cdr.markForCheck();
            this.avisarPresentacionesSinCargar();
          },
        });
    }
  }

  private avisarPresentacionesSinCargar(): void {
    this.notificacionService.openWarn(AVISO_SIN_PRESENTACIONES, 6);
  }

  onRemoverProducto(): void {
    this.selectedProducto = null;
    this.presentacionesDisponibles = [];
    this.itemForm.get('searchProducto')?.setValue('');
    this.itemForm.get('producto')?.setValue(null);
    this.itemForm.get('presentacion')?.setValue(null);
    this.updateComputedProperties();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.itemForm.valid) {
      // getRawValue: con bonificación el control de precio está deshabilitado y `value` lo omite
      const formValue = this.itemForm.getRawValue();

      // Precio 0 solo vale para bonificaciones o ítems rechazados: la recepción no aplica
      // costo con precio 0, y un producto nuevo quedaría sin costo para siempre.
      if (!formValue.esBonificacion
          && formValue.estado !== NotaRecepcionItemEstado.RECHAZADO
          && !(Number(formValue.precioUnitario) > 0)) {
        this.notificacionService.openWarn(
          'El precio unitario debe ser mayor a 0. Si el producto viene sin cargo, márquelo como bonificación'
        );
        return;
      }

      this.actualizarGuardando(true);

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
        itemToSave.notaRecepcion = { id: this.notaRecepcionId } as NotaRecepcion;
      }

      // Convertir a input para el backend
      const itemInput = itemToSave.toInput();

      // Llamar servicio para guardar
      this.pedidoService.onSaveNotaRecepcionItem(itemInput)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (itemGuardado) => {
            this.actualizarGuardando(false);
            // Al editar, el aviso de éxito lo da quien abrió el diálogo (un solo verde)
            if (this.isNewItem) {
              this.notificacionService.openSucess('Ítem agregado exitosamente');
            }
            this.dialogRef.close(itemGuardado);
          },
          error: (error: unknown) => {
            console.error('Error al guardar ítem:', error);
            this.actualizarGuardando(false);
            // En un rechazo el genérico ya mostró el motivo y el diálogo queda para corregir
            if (erroresDeRechazo(error) != null) {
              return;
            }
            const aviso = avisoTrasMutacion(error, this.isNewItem ? 'se agregó el ítem' : 'se actualizó el ítem');
            if (this.isNewItem) {
              const resultado: ItemDeNotaSinConfirmar = { recargar: true, aviso };
              this.dialogRef.close(resultado);
              return;
            }
            // Editar con id no duplica: el diálogo queda para reintentar
            if (aviso != null) {
              this.notificacionService.openWarn(aviso, 8);
            }
          },
        });
    } else {
      this.updateComputedProperties();
      this.cdr.markForCheck();
      this.notificacionService.openAlgoSalioMal('Por favor, complete todos los campos requeridos');
    }
  }

  private actualizarGuardando(guardando: boolean): void {
    this.saving = guardando;
    this.updateComputedProperties();
    this.cdr.markForCheck();
  }
}
