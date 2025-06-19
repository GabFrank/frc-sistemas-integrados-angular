import { Component, Inject, OnInit, ViewChild, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatSelect } from '@angular/material/select';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { PedidoItem } from '../../../edit-pedido/pedido-item.model';
import { Presentacion } from '../../../../../productos/presentacion/presentacion.model';
import { PedidoService } from '../../../pedido.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';

export interface VerificarPedidoItemRecepcionMercaderiaDialogData {
  pedidoItem: PedidoItem;
  isEditing: boolean;
}

export interface VerificarPedidoItemRecepcionMercaderiaDialogResult {
  confirmed: boolean;
  updatedItem?: PedidoItem;
  needsUIRefresh?: boolean;
}

interface QualityOption {
  value: string;
  label: string;
  icon: string;
  color: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-verificar-pedido-item-recepcion-mercaderia',
  templateUrl: './verificar-pedido-item-recepcion-mercaderia.component.html',
  styleUrls: ['./verificar-pedido-item-recepcion-mercaderia.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerificarPedidoItemRecepcionMercaderiaComponent implements OnInit {

  @ViewChild('saveButton') saveButton: MatButton;
  @ViewChild('cancelButton') cancelButton: MatButton;
  @ViewChild('presentacionSelect') presentacionSelect: MatSelect;
  @ViewChild('estadoProductoSelect') estadoProductoSelect: MatSelect;
  @ViewChild('fechaVencimientoInput') fechaVencimientoInput: ElementRef<HTMLInputElement>;
  @ViewChild('cantidadRecibidaInput') cantidadRecibidaInput: ElementRef<HTMLInputElement>;
  @ViewChild('motivoRechazoTextarea') motivoRechazoTextarea: ElementRef<HTMLTextAreaElement>;
  @ViewChild('observacionesTextarea') observacionesTextarea: ElementRef<HTMLTextAreaElement>;

  form: FormGroup;
  loading = false;
  
  // Data
  pedidoItem: PedidoItem;
  isEditing: boolean;
  
  // Original quantities for comparison
  originalQuantity: number;
  originalPresentacion: Presentacion | null;
  
  // Computed properties for template (no function calls in template)
  dialogTitleComputed = '';
  saveButtonTextComputed = '';
  canVerifyComputed = false;
  hasQuantityChangesComputed = false;
  hasPresentacionChangesComputed = false;
  hasQualityIssuesComputed = false;
  productInfoComputed = '';
  expectedQuantityComputed = '';
  
  // Static data for template
  qualityOptionsComputed: QualityOption[] = [];

  // Form field error states (pre-computed to avoid function calls in template)
  cantidadRecibidaErrorComputed = '';
  estadoProductoErrorComputed = '';
  fechaVencimientoErrorComputed = '';
  motivoRechazoErrorComputed = '';
  observacionesErrorComputed = '';
  
  // Form field error flags
  cantidadRecibidaHasErrorComputed = false;
  estadoProductoHasErrorComputed = false;
  fechaVencimientoHasErrorComputed = false;
  motivoRechazoHasErrorComputed = false;
  observacionesHasErrorComputed = false;
  nuevaPresentacionHasErrorComputed = false;
  nuevaPresentacionErrorComputed = '';
  
  // Conditional visibility
  showFechaVencimientoComputed = false;
  
  // Keyboard navigation state
  private presentacionEnterCount = 0;
  private estadoProductoEnterCount = 0;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<VerificarPedidoItemRecepcionMercaderiaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VerificarPedidoItemRecepcionMercaderiaDialogData,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionSnackbarService
  ) {
    // Create a proper copy of the pedido item
    this.pedidoItem = new PedidoItem();
    Object.assign(this.pedidoItem, data.pedidoItem);
    this.isEditing = data.isEditing;
    
    // Store original values
    this.originalQuantity = this.pedidoItem.cantidadRecepcionNota || this.pedidoItem.cantidadCreacion || 0;
    this.originalPresentacion = this.pedidoItem.presentacionRecepcionNota || this.pedidoItem.presentacionCreacion || null;
    
    // Initialize static computed properties
    this.initializeStaticComputedProperties();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.checkFechaVencimientoVisibility();
    this.updateAllComputedProperties();
    this.setupFormValidation();
    
    // Set initial focus after view init
    setTimeout(() => {
      this.setInitialFocus();
    }, 200);
  }

  /**
   * Initialize static computed properties that don't change
   */
  private initializeStaticComputedProperties(): void {
    // Product info
    this.productInfoComputed = `${this.pedidoItem.producto?.descripcion} - ${this.pedidoItem.producto?.codigoPrincipal}`;
    
    // Expected quantity
    this.expectedQuantityComputed = `${this.originalQuantity} ${this.originalPresentacion?.descripcion || ''}`;
    
    // Quality options
    this.qualityOptionsComputed = [
      { value: 'BUENO', label: 'Bueno', icon: 'check_circle', color: 'accent' },
      { value: 'REGULAR', label: 'Regular', icon: 'warning', color: 'warn' },
      { value: 'MALO', label: 'Malo', icon: 'error', color: 'warn' },
      { value: 'DAÑADO', label: 'Dañado', icon: 'broken_image', color: 'warn' }
    ];
  }

  /**
   * Initialize the verification form
   */
  private initializeForm(): void {
    const currentDate = new Date();
    const defaultExpiration = new Date();
    defaultExpiration.setFullYear(currentDate.getFullYear() + 1); // Default 1 year from now

    // Get existing date or use default, then format as string
    const existingDate = this.pedidoItem.vencimientoRecepcionProducto || 
                        this.pedidoItem.vencimientoRecepcionNota ||
                        this.pedidoItem.vencimientoCreacion ||
                        defaultExpiration;
    
    const formattedDate = this.formatDateForInput(existingDate);

    this.form = this.fb.group({
      // Quantity verification
      cantidadRecibida: [
        this.pedidoItem.cantidadRecepcionProducto || this.originalQuantity,
        [Validators.required, Validators.min(0)]
      ],
      
      // Quality control
      estadoProducto: [
        'BUENO', // Default to good quality
        [Validators.required]
      ],
      
      // Expiration date (as formatted string for manual input)
      fechaVencimiento: [
        formattedDate
      ],
      
      // Presentation changes
      nuevaPresentacion: [
        this.pedidoItem.presentacionRecepcionProducto ||
        this.originalPresentacion
      ],
      
      // Rejection reasons (if applicable)
      motivoRechazo: [
        this.pedidoItem.motivoRechazoRecepcionProducto || ''
      ],
      
      // Observations
      observaciones: [
        this.pedidoItem.obsRecepcionProducto || ''
      ],
      
      // Verification status
      verificado: [
        this.pedidoItem.verificadoRecepcionProducto || false
      ]
    });
  }

  /**
   * Format a Date object for the input field (DD/MM/YYYY)
   */
  private formatDateForInput(date: Date | string | null): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  /**
   * Setup form validation and change detection
   */
  private setupFormValidation(): void {
    // Watch for changes that affect verification ability
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateAllComputedProperties();
      });

    // Specific validations for quality control
    this.form.get('estadoProducto')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(estado => {
        this.updateQualityValidation(estado);
        this.updateAllComputedProperties();
      });

    // Quantity validation
    this.form.get('cantidadRecibida')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(cantidad => {
        this.updateQuantityValidation(cantidad);
        this.updateAllComputedProperties();
      });
  }

  /**
   * Update all computed properties for template binding (avoiding function calls in template)
   */
  private updateAllComputedProperties(): void {
    // Dialog title and button text
    this.dialogTitleComputed = this.isEditing ? 'Editar Verificación' : 'Verificar Producto';
    this.saveButtonTextComputed = this.isEditing ? 'Guardar Cambios' : 'Verificar Producto';
    
    // Check if form is valid and can be verified
    this.canVerifyComputed = this.form.valid && (this.form.get('cantidadRecibida')?.value || 0) > 0;
    
    // Check for changes
    const formValues = this.form.value;
    this.hasQuantityChangesComputed = (formValues.cantidadRecibida || 0) !== this.originalQuantity;
    this.hasPresentacionChangesComputed = formValues.nuevaPresentacion?.id !== this.originalPresentacion?.id;
    this.hasQualityIssuesComputed = formValues.estadoProducto !== 'BUENO';
    
    // Update form field errors
    this.updateFormErrorComputedProperties();
  }

  /**
   * Update form error computed properties
   */
  private updateFormErrorComputedProperties(): void {
    // Cantidad Recibida
    this.cantidadRecibidaErrorComputed = this.getFieldErrorMessage('cantidadRecibida');
    this.cantidadRecibidaHasErrorComputed = this.hasFieldErrorFlag('cantidadRecibida');
    
    // Estado Producto
    this.estadoProductoErrorComputed = this.getFieldErrorMessage('estadoProducto');
    this.estadoProductoHasErrorComputed = this.hasFieldErrorFlag('estadoProducto');
    
    // Fecha Vencimiento
    this.fechaVencimientoErrorComputed = this.getFieldErrorMessage('fechaVencimiento');
    this.fechaVencimientoHasErrorComputed = this.hasFieldErrorFlag('fechaVencimiento');
    
    // Motivo Rechazo
    this.motivoRechazoErrorComputed = this.getFieldErrorMessage('motivoRechazo');
    this.motivoRechazoHasErrorComputed = this.hasFieldErrorFlag('motivoRechazo');
    
    // Observaciones
    this.observacionesErrorComputed = this.getFieldErrorMessage('observaciones');
    this.observacionesHasErrorComputed = this.hasFieldErrorFlag('observaciones');
    
    // Nueva Presentacion
    this.nuevaPresentacionErrorComputed = this.getFieldErrorMessage('nuevaPresentacion');
    this.nuevaPresentacionHasErrorComputed = this.hasFieldErrorFlag('nuevaPresentacion');
  }

  /**
   * Update quality-related validation
   */
  private updateQualityValidation(estado: string): void {
    const motivoControl = this.form.get('motivoRechazo');
    
    if (estado === 'MALO' || estado === 'DAÑADO') {
      // Require rejection reason for bad/damaged products
      motivoControl?.setValidators([Validators.required]);
      motivoControl?.updateValueAndValidity();
    } else {
      // Optional rejection reason for good products
      motivoControl?.clearValidators();
      motivoControl?.updateValueAndValidity();
    }
  }

  /**
   * Update quantity-related validation
   */
  private updateQuantityValidation(cantidad: number): void {
    if (cantidad > this.originalQuantity) {
      // Warn about receiving more than expected
      this.form.get('cantidadRecibida')?.setErrors({ 
        exceedsExpected: true 
      });
    }
  }

  /**
   * Save verification data
   */
  save(): void {
    if (!this.form.valid || this.loading) {
      this.markFormGroupTouched();
      this.updateAllComputedProperties();
      return;
    }

    this.loading = true;
    const formValues = this.form.value;

    // Create updated pedido item
    const updatedItem = new PedidoItem();
    Object.assign(updatedItem, this.pedidoItem);

    // Convert formatted date string to Date object for backend
    const fechaVencimientoDate = this.getDateObjectFromFormattedString(formValues.fechaVencimiento);

    // Update verification fields with form data
    updatedItem.cantidadRecepcionProducto = formValues.cantidadRecibida;
    updatedItem.vencimientoRecepcionProducto = fechaVencimientoDate;
    updatedItem.presentacionRecepcionProducto = formValues.nuevaPresentacion;
    updatedItem.motivoRechazoRecepcionProducto = formValues.motivoRechazo || null;
    updatedItem.obsRecepcionProducto = formValues.observaciones || null;
    updatedItem.verificadoRecepcionProducto = true;

    // Save to backend using the PedidoService
    this.pedidoService.onSaveItem(updatedItem.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (savedItem) => {
          this.loading = false;
          
          const message = this.isEditing ? 
            'Verificación actualizada exitosamente' : 
            'Producto verificado exitosamente';
          
          this.notificacionService.openSucess(message);
          
          const result: VerificarPedidoItemRecepcionMercaderiaDialogResult = {
            confirmed: true,
            updatedItem: savedItem,
            needsUIRefresh: true
          };
          
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error saving verification:', error);
          this.notificacionService.openWarn('Error al guardar la verificación');
        }
      });
  }

  /**
   * Cancel dialog
   */
  cancel(): void {
    const result: VerificarPedidoItemRecepcionMercaderiaDialogResult = {
      confirmed: false,
      needsUIRefresh: false
    };
    
    this.dialogRef.close(result);
  }

  /**
   * Mark all form fields as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get error message for a form field (used internally for computed properties)
   */
  private getFieldErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    
    if (errors['required']) {
      return 'Este campo es requerido';
    }
    
    if (errors['min']) {
      return 'La cantidad debe ser mayor a 0';
    }
    
    if (errors['exceedsExpected']) {
      return 'La cantidad recibida excede la cantidad esperada';
    }

    // Date validation errors
    if (errors['invalidFormat']) {
      return 'Formato de fecha inválido. Use DD/MM/AAAA';
    }
    
    if (errors['invalidMonth']) {
      return 'Mes inválido (1-12)';
    }
    
    if (errors['invalidDay']) {
      return 'Día inválido (1-31)';
    }
    
    if (errors['invalidDate']) {
      return 'Fecha no válida';
    }
    
    if (errors['pastDate']) {
      return 'La fecha de vencimiento no puede ser anterior a hoy';
    }

    return 'Campo inválido';
  }

  /**
   * Check if field has error (used internally for computed properties)
   */
  private hasFieldErrorFlag(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.errors && control.touched);
  }

  /**
   * Check if fecha vencimiento should be visible based on producto.vencimiento
   */
  private checkFechaVencimientoVisibility(): void {
    this.showFechaVencimientoComputed = this.pedidoItem?.producto?.vencimiento === true;
  }

  /**
   * Set initial focus based on fecha vencimiento visibility
   */
  private setInitialFocus(): void {
    if (this.showFechaVencimientoComputed && this.fechaVencimientoInput?.nativeElement) {
      this.fechaVencimientoInput.nativeElement.focus();
      this.fechaVencimientoInput.nativeElement.select();
    } else if (this.cantidadRecibidaInput?.nativeElement) {
      this.cantidadRecibidaInput.nativeElement.focus();
      this.cantidadRecibidaInput.nativeElement.select();
    }
  }

  /**
   * Enhanced keyboard navigation for presentacion select
   */
  onPresentacionKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.presentacionEnterCount++;

      if (this.presentacionEnterCount === 1) {
        // First Enter: open the dropdown
        if (this.presentacionSelect && !this.presentacionSelect.panelOpen) {
          this.presentacionSelect.open();
        }
      } else if (this.presentacionEnterCount >= 2) {
        // Second Enter: close dropdown and move to next field
        if (this.presentacionSelect && this.presentacionSelect.panelOpen) {
          this.presentacionSelect.close();
        }
        setTimeout(() => {
          this.focusEstadoProducto();
        }, 100);
      }
    }
  }

  onPresentacionSelectionChange(): void {
    // Reset enter count when user makes a selection
    this.presentacionEnterCount = 0;
  }

  onPresentacionClosed(): void {
    // Move to next field when dropdown closes
    if (this.presentacionEnterCount >= 1) {
      setTimeout(() => {
        this.focusEstadoProducto();
      }, 100);
    }
  }

  /**
   * Enhanced keyboard navigation for estado producto select
   */
  onEstadoProductoKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.estadoProductoEnterCount++;

      if (this.estadoProductoEnterCount === 1) {
        // First Enter: open the dropdown
        if (this.estadoProductoSelect && !this.estadoProductoSelect.panelOpen) {
          this.estadoProductoSelect.open();
        }
      } else if (this.estadoProductoEnterCount >= 2) {
        // Second Enter: close dropdown and move to next field
        if (this.estadoProductoSelect && this.estadoProductoSelect.panelOpen) {
          this.estadoProductoSelect.close();
        }
        setTimeout(() => {
          this.focusNextAfterEstadoProducto();
        }, 100);
      }
    }
  }

  onEstadoProductoSelectionChange(): void {
    // Reset enter count when user makes a selection
    this.estadoProductoEnterCount = 0;
  }

  onEstadoProductoClosed(): void {
    // Move to next field when dropdown closes
    if (this.estadoProductoEnterCount >= 1) {
      setTimeout(() => {
        this.focusNextAfterEstadoProducto();
      }, 100);
    }
  }

  /**
   * Keyboard navigation for fecha vencimiento
   */
  onFechaVencimientoKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // Validate current field before moving
      const control = this.form.get('fechaVencimiento');
      if (control && control.invalid) {
        control.markAsTouched();
        this.updateAllComputedProperties();
        return;
      }
      
      this.focusCantidadRecibida();
    }
    
    // Only allow numbers, backspace, delete, tab, and arrow keys
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    const isNumber = /^[0-9]$/.test(event.key);
    
    if (!isNumber && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Handle date input formatting
   */
  onFechaVencimientoInput(event: any): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;
    
    // Determine separator based on user preference (detect first separator used)
    let separator = '/';
    if (rawValue.includes('-') && !rawValue.includes('/')) {
      separator = '-';
    }
    
    let value = rawValue.replace(/[^\d]/g, ''); // Remove all non-digits
    
    // Format with automatic separator insertion
    if (value.length >= 2) {
      value = value.substring(0, 2) + separator + value.substring(2);
    }
    if (value.length >= 5) {
      value = value.substring(0, 5) + separator + value.substring(5);
    }
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    
    // Update the input value
    input.value = value;
    
    // Update the form control
    this.form.get('fechaVencimiento')?.setValue(value, { emitEvent: false });
    
    // Validate the date format
    this.validateDateFormat(value);
  }

  /**
   * Validate date format and convert to Date object
   */
  private validateDateFormat(dateString: string): void {
    const control = this.form.get('fechaVencimiento');
    if (!control) return;

    if (!dateString || dateString.length === 0) {
      control.setErrors(null);
      return;
    }

    // Check if format is complete (DD/MM/YYYY, DD/MM/YY, DD-MM-YYYY, or DD-MM-YY)
    const datePattern = /^(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})$/;
    const match = dateString.match(datePattern);
    
    if (!match) {
      control.setErrors({ invalidFormat: true });
      this.updateAllComputedProperties();
      return;
    }

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);
    
    // Convert 2-digit year to 4-digit year
    if (year < 100) {
      // Assume years 00-30 are 2000-2030, and 31-99 are 1931-1999
      year = year <= 30 ? 2000 + year : 1900 + year;
    }

    // Validate date components
    if (month < 1 || month > 12) {
      control.setErrors({ invalidMonth: true });
      this.updateAllComputedProperties();
      return;
    }

    if (day < 1 || day > 31) {
      control.setErrors({ invalidDay: true });
      this.updateAllComputedProperties();
      return;
    }

    // Create date object and validate it exists
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      control.setErrors({ invalidDate: true });
      this.updateAllComputedProperties();
      return;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      control.setErrors({ pastDate: true });
      this.updateAllComputedProperties();
      return;
    }

    // Date is valid, clear errors but keep the formatted string value
    control.setErrors(null);
    this.updateAllComputedProperties();
  }

  /**
   * Convert the formatted date string to a Date object for backend submission
   */
  private getDateObjectFromFormattedString(dateString: string): Date | null {
    if (!dateString) return null;
    
    const datePattern = /^(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})$/;
    const match = dateString.match(datePattern);
    
    if (!match) return null;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);
    
    // Convert 2-digit year to 4-digit year
    if (year < 100) {
      year = year <= 30 ? 2000 + year : 1900 + year;
    }
    
    return new Date(year, month - 1, day);
  }

  /**
   * Keyboard navigation for cantidad recibida
   */
  onCantidadRecibidaKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // Validate current field before moving
      const control = this.form.get('cantidadRecibida');
      if (control && control.invalid) {
        control.markAsTouched();
        this.updateAllComputedProperties();
        return;
      }
      
      // Navigate to next field based on quality issues
      if (this.hasQualityIssuesComputed) {
        this.focusMotivoRechazo();
      } else {
        this.focusObservaciones();
      }
    }
  }

  /**
   * Focus management methods
   */
  private focusEstadoProducto(): void {
    if (this.estadoProductoSelect) {
      this.estadoProductoSelect.focus();
      this.estadoProductoEnterCount = 0;
    }
  }

  private focusNextAfterEstadoProducto(): void {
    if (this.showFechaVencimientoComputed) {
      this.focusFechaVencimiento();
    } else {
      this.focusCantidadRecibida();
    }
  }

  private focusFechaVencimiento(): void {
    if (this.fechaVencimientoInput?.nativeElement) {
      this.fechaVencimientoInput.nativeElement.focus();
    }
  }

  private focusCantidadRecibida(): void {
    if (this.cantidadRecibidaInput?.nativeElement) {
      this.cantidadRecibidaInput.nativeElement.focus();
      this.cantidadRecibidaInput.nativeElement.select();
    }
  }

  private focusVerificarButton(): void {
    if (this.saveButton?._elementRef?.nativeElement) {
      this.saveButton._elementRef.nativeElement.focus();
    }
  }

  /**
   * Keyboard navigation for motivo rechazo textarea
   */
  onMotivoRechazoKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.focusObservaciones();
    }
  }

  /**
   * Keyboard navigation for observaciones textarea
   */
  onObservacionesKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.focusVerificarButton();
    }
  }

  /**
   * Focus observaciones field
   */
  private focusObservaciones(): void {
    if (this.observacionesTextarea?.nativeElement) {
      this.observacionesTextarea.nativeElement.focus();
    }
  }

  /**
   * Focus motivo rechazo field
   */
  private focusMotivoRechazo(): void {
    if (this.motivoRechazoTextarea?.nativeElement) {
      this.motivoRechazoTextarea.nativeElement.focus();
    }
  }
} 