import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { Pedido } from '../../../edit-pedido/pedido.model';
import { PedidoItem } from '../../../edit-pedido/pedido-item.model';
import { NotaRecepcion } from '../../../nota-recepcion/nota-recepcion.model';
import { NotaRecepcionService } from '../../../nota-recepcion/nota-recepcion.service';
import { PedidoService } from '../../../pedido.service';
import { MainService } from '../../../../../../main.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';

export interface CrearNotaRecepcionDialogData {
  pedido: Pedido;
  notaRecepcion?: NotaRecepcion;
  selectedItems?: PedidoItem[];
  isEditing?: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-crear-nota-recepcion-dialog',
  templateUrl: './crear-nota-recepcion-dialog.component.html',
  styleUrls: ['./crear-nota-recepcion-dialog.component.scss']
})
export class CrearNotaRecepcionDialogComponent implements OnInit {
  
  @ViewChild('saveButton', { static: false }) saveButton!: MatButton;
  
  notaForm: FormGroup;
  tipoBoletaOptions = ['LEGAL', 'COMUN', 'OTRO'];
  
  // Loading states
  isLoading = false;
  isSaving = false;
  
  // Data
  pedido: Pedido;
  notaRecepcion: NotaRecepcion | null = null;
  selectedItems: PedidoItem[] = [];
  isEditMode = false;

  // Computed properties for template (to avoid function calls in HTML)
  monedaSymbolComputed = 'Gs.';
  totalValueOfSelectedItemsComputed = 0;
  numeroErrorComputed = '';
  fechaErrorComputed = '';
  tipoBoletaErrorComputed = '';
  isFormValidComputed = false;
  selectedItemsCountComputed = 0;
  dialogTitleComputed = '';
  saveButtonTextComputed = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CrearNotaRecepcionDialogData,
    private dialogRef: MatDialogRef<CrearNotaRecepcionDialogComponent>,
    private notaRecepcionService: NotaRecepcionService,
    private pedidoService: PedidoService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService
  ) {
    this.pedido = data.pedido;
    this.notaRecepcion = data.notaRecepcion || null;
    this.selectedItems = data.selectedItems || [];
    this.isEditMode = !!data.isEditing;
  }

  ngOnInit(): void {
    this.buildForm();
    this.loadData();
    this.updateComputedProperties();
    this.setupFormSubscriptions();
  }

  private setupFormSubscriptions(): void {
    // Update computed properties when form changes
    this.notaForm.valueChanges.subscribe(() => {
      this.updateComputedProperties();
    });
    
    this.notaForm.statusChanges.subscribe(() => {
      this.updateComputedProperties();
    });
  }

  private updateComputedProperties(): void {
    // Update moneda symbol
    this.monedaSymbolComputed = this.pedido?.moneda?.simbolo || 'Gs.';
    
    // Update total value
    this.totalValueOfSelectedItemsComputed = this.selectedItems.reduce((total, item) => total + (item.valorTotal || 0), 0);
    
    // Update form validation
    this.isFormValidComputed = this.notaForm.valid;
    
    // Update counts
    this.selectedItemsCountComputed = this.selectedItems.length;
    
    // Update dialog title
    this.dialogTitleComputed = this.isEditMode ? 'Editar Nota de Recepción' : 'Crear Nueva Nota de Recepción';
    
    // Update save button text
    if (this.isSaving) {
      this.saveButtonTextComputed = this.isEditMode ? 'Actualizando...' : 'Creando...';
    } else {
      this.saveButtonTextComputed = this.isEditMode ? 'Actualizar' : 'Crear Nota';
    }
    
    // Update error messages
    this.updateErrorMessages();
  }

  private updateErrorMessages(): void {
    // Update numero error
    const numeroControl = this.notaForm.get('numero');
    if (numeroControl?.hasError('required')) {
      this.numeroErrorComputed = 'El número de nota es requerido';
    } else if (numeroControl?.hasError('min')) {
      this.numeroErrorComputed = 'El número debe ser mayor a 0';
    } else {
      this.numeroErrorComputed = '';
    }

    // Update fecha error - simplified since datepicker handles most validation
    const fechaControl = this.notaForm.get('fecha');
    if (fechaControl?.hasError('required')) {
      this.fechaErrorComputed = 'La fecha es requerida';
    } else if (fechaControl?.hasError('matDatepickerParse')) {
      this.fechaErrorComputed = 'Fecha inválida';
    } else {
      this.fechaErrorComputed = '';
    }

    // Update tipo boleta error
    const tipoControl = this.notaForm.get('tipoBoleta');
    if (tipoControl?.hasError('required')) {
      this.tipoBoletaErrorComputed = 'El tipo de boleta es requerido';
    } else {
      this.tipoBoletaErrorComputed = '';
    }
  }

  private buildForm(): void {
    // Get current date for default value
    const today = new Date();

    this.notaForm = new FormGroup({
      numero: new FormControl(null, [Validators.required, Validators.min(1)]),
      tipoBoleta: new FormControl('LEGAL', Validators.required),
      fecha: new FormControl(today, Validators.required), // Use Date object directly
      timbrado: new FormControl(null),
      observaciones: new FormControl('')
    });
  }

  private loadData(): void {
    if (this.isEditMode && this.notaRecepcion) {
      // Populate form with existing nota data
      this.notaForm.patchValue({
        numero: this.notaRecepcion.numero,
        tipoBoleta: this.notaRecepcion.tipoBoleta || 'LEGAL',
        fecha: this.notaRecepcion.fecha ? new Date(this.notaRecepcion.fecha) : new Date(), // Convert to Date object
        timbrado: this.notaRecepcion.timbrado,
        observaciones: this.notaRecepcion.documento?.descripcion || ''
      });
    }
  }

  onSave(): void {
    if (this.notaForm.invalid) {
      this.notaForm.markAllAsTouched();
      this.notificacionService.openWarn('Por favor complete todos los campos requeridos');
      return;
    }

    this.isSaving = true;
    this.updateComputedProperties(); // Update save button text

    if (this.isEditMode) {
      this.updateNota();
    } else {
      this.createNota();
    }
  }

  private createNota(): void {
    const formValue = this.notaForm.value;
    
    // Create new nota recepcion
    const nuevaNota = new NotaRecepcion();
    nuevaNota.pedido = this.pedido;
    nuevaNota.numero = formValue.numero;
    nuevaNota.tipoBoleta = formValue.tipoBoleta.toString();
    nuevaNota.fecha = formValue.fecha;
    nuevaNota.timbrado = formValue.timbrado;
    nuevaNota.usuario = this.mainService.usuarioActual;
    nuevaNota.valor = 0; // Will be calculated when items are assigned

    this.notaRecepcionService.onSaveNotaRecepcion(nuevaNota.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (savedNota) => {
          if (this.selectedItems.length > 0) {
            // Assign selected items to the new nota
            this.assignItemsToNota(savedNota.id);
          } else {
            this.isSaving = false;
            this.dialogRef.close({ 
              notaCreated: true, 
              nota: savedNota 
            });
          }
        },
        error: () => {
          this.isSaving = false;
          this.notificacionService.openWarn('Error al crear la nota de recepción');
        }
      });
  }

  private updateNota(): void {
    const formValue = this.notaForm.value;
    
    // Update existing nota
    const notaToUpdate = new NotaRecepcion();
    Object.assign(notaToUpdate, this.notaRecepcion);
    
    notaToUpdate.numero = formValue.numero;
    notaToUpdate.tipoBoleta = formValue.tipoBoleta.toString();
    notaToUpdate.fecha = formValue.fecha;
    notaToUpdate.timbrado = formValue.timbrado;

    this.notaRecepcionService.onSaveNotaRecepcion(notaToUpdate.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (updatedNota) => {
          this.isSaving = false;
          this.dialogRef.close({ 
            notaUpdated: true, 
            nota: updatedNota 
          });
        },
        error: () => {
          this.isSaving = false;
          this.notificacionService.openWarn('Error al actualizar la nota de recepción');
        }
      });
  }

  private async assignItemsToNota(notaRecepcionId: number): Promise<void> {
    try {
      // Assign each selected item to the nota
      for (const item of this.selectedItems) {
        await this.pedidoService.onAddPedidoItemToNotaRecepcion(notaRecepcionId, item.id).toPromise();
      }

      this.isSaving = false;
      this.dialogRef.close({ 
        notaCreated: true, 
        itemsAssigned: this.selectedItems.length 
      });
    } catch (error) {
      this.isSaving = false;
      this.notificacionService.openWarn('Error al asignar items a la nota');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Getters for template
  get isFormValid(): boolean {
    return this.isFormValidComputed;
  }

  get selectedItemsCount(): number {
    return this.selectedItemsCountComputed;
  }

  get dialogTitle(): string {
    return this.dialogTitleComputed;
  }

  get saveButtonText(): string {
    return this.saveButtonTextComputed;
  }

  // Utility methods
  getTotalValueOfSelectedItems(): number {
    return this.totalValueOfSelectedItemsComputed;
  }

  getMonedaSymbol(): string {
    return this.monedaSymbolComputed;
  }

  // Form field error getters
  getNumeroError(): string {
    return this.numeroErrorComputed;
  }

  getFechaError(): string {
    return this.fechaErrorComputed;
  }

  getTipoBoletaError(): string {
    return this.tipoBoletaErrorComputed;
  }

  // Keyboard navigation methods
  onNumeroKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const numeroControl = this.notaForm.get('numero');
      if (numeroControl && numeroControl.valid) {
        const tipoBoletaSelect = document.querySelector('mat-select[formControlName="tipoBoleta"]') as HTMLElement;
        if (tipoBoletaSelect) {
          tipoBoletaSelect.focus();
        }
      } else {
        // Mark field as touched to show validation error
        numeroControl?.markAsTouched();
        this.updateComputedProperties();
      }
    }
  }

  onTipoBoletaKeyDown(event: KeyboardEvent): void {
    // Don't handle Enter here - let mat-select handle opening dropdown
    // Navigation will happen on selectionChange or closed event
  }

  onTipoBoletaSelectionChange(): void {
    // Navigate to next field after selection is made
    const tipoBoletaControl = this.notaForm.get('tipoBoleta');
    if (tipoBoletaControl && tipoBoletaControl.valid) {
      setTimeout(() => {
        const fechaInput = document.querySelector('input[formControlName="fecha"]') as HTMLElement;
        if (fechaInput) {
          fechaInput.focus();
        }
      }, 100); // Small delay to ensure dropdown is closed
    }
  }

  onTipoBoletaClosed(): void {
    // Alternative method - navigate when dropdown closes
    const tipoBoletaControl = this.notaForm.get('tipoBoleta');
    if (tipoBoletaControl && tipoBoletaControl.valid) {
      const fechaInput = document.querySelector('input[formControlName="fecha"]') as HTMLElement;
      if (fechaInput) {
        fechaInput.focus();
      }
    } else {
      // Mark field as touched to show validation error
      tipoBoletaControl?.markAsTouched();
      this.updateComputedProperties();
    }
  }

  onFechaKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const fechaControl = this.notaForm.get('fecha');
      if (fechaControl && fechaControl.valid) {
        const timbradoInput = document.querySelector('input[formControlName="timbrado"]') as HTMLElement;
        if (timbradoInput) {
          timbradoInput.focus();
        }
      } else {
        // Mark field as touched to show validation error
        fechaControl?.markAsTouched();
        this.updateComputedProperties();
      }
    }
  }

  onTimbradoKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Timbrado is optional, so always allow navigation
      const observacionesTextarea = document.querySelector('textarea[formControlName="observaciones"]') as HTMLElement;
      if (observacionesTextarea) {
        observacionesTextarea.focus();
      }
    }
  }

  onObservacionesKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      // Observaciones is optional, so always allow navigation to save button
      if (this.saveButton && this.isFormValid) {
        this.saveButton.focus();
      }
    }
  }

  onSaveButtonKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSave();
    }
  }
} 