import { Component, Inject, OnInit, Input, Output, EventEmitter, Optional } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PedidoItem, MotivoRechazoRecepcionNota, MotivoHelper } from '../../../edit-pedido/pedido-item.model';
import { PedidoService } from '../../../pedido.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';

export interface ItemStatusDialogData {
  pedidoItem: PedidoItem;
  isReadOnly?: boolean;
}

export interface ItemStatusDialogResult {
  updated: boolean;
  pedidoItem?: PedidoItem;
  motivoRechazoRecepcionNota?: string;
  obsRecepcionNota?: string;
  cancelado?: boolean;
}

@Component({
  selector: 'app-item-status-dialog',
  templateUrl: './item-status-dialog.component.html',
  styleUrls: ['./item-status-dialog.component.scss']
})
export class ItemStatusDialogComponent implements OnInit {
  // Embedded mode inputs
  @Input() isEmbedded: boolean = false;
  @Input() embeddedPedidoItem: PedidoItem | null = null;
  @Input() embeddedIsReadOnly: boolean = false;

  // Embedded mode outputs
  @Output() embeddedSaved = new EventEmitter<ItemStatusDialogResult>();
  @Output() embeddedCancelled = new EventEmitter<void>();

  // Form group - will be initialized in ngOnInit based on read-only state
  statusForm: FormGroup;

  // Available motivos for rejection
  motivosRechazo = Object.values(MotivoRechazoRecepcionNota);
  motivoLabels = MotivoHelper.getMotivoRechazoLabels();

  // UI State
  isProcessing = false;
  showDialogHeader = true;
  dialogTitle = '';
  productDescription = '';
  isCurrentlyRejected = false;
  currentPedidoItem: PedidoItem | null = null;
  currentIsReadOnly = false;

  // **NEW**: Computed properties for template usage (no getters/functions)
  isRejectedComputed = false;
  canSaveComputed = false;
  toggleLabelComputed = '';
  observacionesLabelComputed = '';
  observacionesPlaceholderComputed = '';
  saveButtonTextComputed = '';
  saveButtonIconComputed = '';

  constructor(
    @Optional() public dialogRef: MatDialogRef<ItemStatusDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: ItemStatusDialogData | null,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupFormSubscriptions();
  }



  // **NEW**: Method to update all computed properties at once
  private updateComputedProperties(): void {
    // Update isRejected computed property
    this.isRejectedComputed = this.statusForm.get('isRejected')?.value || false;

    // Update canSave computed property
    if (this.currentIsReadOnly || this.isProcessing || !this.statusForm.valid) {
      this.canSaveComputed = false;
    } else {
      const hasMotivos = this.statusForm.get('motivoRechazo')?.value?.length > 0;
      this.canSaveComputed = !this.isRejectedComputed || (this.isRejectedComputed && hasMotivos);
    }

    // Update toggle label
    if (this.currentIsReadOnly) {
      this.toggleLabelComputed = this.isRejectedComputed ? 'Está rechazado' : 'No está rechazado';
    } else {
      this.toggleLabelComputed = this.isRejectedComputed ? 'Remover rechazo' : 'Marcar como rechazado';
    }

    // Update observaciones labels
    this.observacionesLabelComputed = this.currentIsReadOnly ? 'Observaciones (Solo lectura)' : 'Observaciones';
    this.observacionesPlaceholderComputed = this.currentIsReadOnly ? 'Sin observaciones adicionales' : 'Ingrese observaciones adicionales';

    // Update save button text and icon
    if (this.isProcessing) {
      this.saveButtonTextComputed = 'Guardando...';
      this.saveButtonIconComputed = 'hourglass_empty';
    } else {
      this.saveButtonTextComputed = this.isRejectedComputed ? 'Guardar Rechazo' : 'Remover Rechazo';
      this.saveButtonIconComputed = this.isRejectedComputed ? 'error' : 'check';
    }
  }

  private createFormWithDisabledState(): void {
    // **NEW**: Create form controls with proper disabled state from the start
    if (this.currentIsReadOnly) {
      // Create all controls as disabled for read-only mode
      this.statusForm = new FormGroup({
        motivoRechazo: new FormControl({value: [], disabled: true}, [Validators.required]),
        isRejected: new FormControl({value: false, disabled: true}),
        observaciones: new FormControl({value: '', disabled: true}, [Validators.maxLength(500)])
      });
      // **NEW**: Disable the entire form group for read-only mode
      this.statusForm.disable();
    } else {
      // Create controls normally for editable mode
      this.statusForm = new FormGroup({
        motivoRechazo: new FormControl([], [Validators.required]),
        isRejected: new FormControl(false),
        observaciones: new FormControl('', [Validators.maxLength(500)])
      });
    }
  }

  private initializeComponent(): void {
    // Initialize UI state
    this.showDialogHeader = !this.isEmbedded;
    

    
    this.currentIsReadOnly = this.getCurrentIsReadOnly();
    this.currentPedidoItem = this.getCurrentPedidoItem();
    
    // **NEW**: Create form with proper disabled state from the start
    this.createFormWithDisabledState();
    
    // Set dialog title
    this.dialogTitle = this.currentIsReadOnly 
      ? 'Ver Estado de Rechazo'
      : 'Gestionar Rechazo del Item';

    // Set product description
    const item = this.currentPedidoItem;
    if (item) {
      this.productDescription = `${item.producto?.descripcion || 'Producto'} - ${item.presentacionRecepcionNota?.cantidad || item.presentacionCreacion?.cantidad || 1}`;
      this.isCurrentlyRejected = !!(item.motivoRechazoRecepcionNota && item.motivoRechazoRecepcionNota.trim());
    }

    // Load current status and update computed properties
    this.loadCurrentStatus();
    this.updateComputedProperties();
  }

  private loadCurrentStatus(): void {
    const item = this.currentPedidoItem;
    if (!item) return;

    const existingMotivoRechazo = MotivoHelper.separateMotivos(item.motivoRechazoRecepcionNota || '');
    const hasRechazo = existingMotivoRechazo.length > 0;

    // **SIMPLIFIED**: Just patch values - disabled state is already set in form creation
    this.statusForm.patchValue({
      motivoRechazo: existingMotivoRechazo,
      isRejected: hasRechazo,
      observaciones: item.obsRecepcionNota || ''
    });
  }

  private setupFormSubscriptions(): void {
    // **SIMPLIFIED**: Don't set up form subscriptions if in read-only mode
    if (this.currentIsReadOnly) {
      return;
    }

    // Handle isRejected changes - simple logic and update computed properties
    this.statusForm.get('isRejected')?.valueChanges.subscribe(isRejected => {
      if (!isRejected) {
        this.statusForm.get('motivoRechazo')?.setValue([]);
        this.statusForm.get('observaciones')?.setValue('');
        this.statusForm.get('observaciones')?.disable();
      } else {
        this.statusForm.get('observaciones')?.enable();
      }
      // **NEW**: Update computed properties when form changes
      this.updateComputedProperties();
    });

    // Handle motivoRechazo changes - simple logic and update computed properties
    this.statusForm.get('motivoRechazo')?.valueChanges.subscribe(motivos => {
      const hasMotivos = motivos && motivos.length > 0;
      const currentlyRejected = this.statusForm.get('isRejected')?.value;
      
      if (hasMotivos && !currentlyRejected) {
        this.statusForm.get('isRejected')?.setValue(true, { emitEvent: false });
        this.statusForm.get('observaciones')?.enable();
      } else if (!hasMotivos && currentlyRejected) {
        this.statusForm.get('isRejected')?.setValue(false, { emitEvent: false });
        this.statusForm.get('observaciones')?.disable();
      }
      // **NEW**: Update computed properties when form changes
      this.updateComputedProperties();
    });
  }



  onCancel(): void {
    if (this.isEmbedded) {
      this.embeddedCancelled.emit();
    } else {
      this.dialogRef?.close({ updated: false } as ItemStatusDialogResult);
    }
  }

  onSave(): void {
    // **CRITICAL FIX**: Prevent saving in read-only mode
    if (this.currentIsReadOnly || !this.canSaveComputed || this.isProcessing) {
      return;
    }

    const formValue = this.statusForm.value;
    
    // Validate rejection requirements
    if (formValue.isRejected && (!formValue.motivoRechazo || formValue.motivoRechazo.length === 0)) {
      this.notificacionService.openWarn('Debe especificar el motivo de rechazo');
      return;
    }

    this.isProcessing = true;
    this.updateComputedProperties(); // Update UI for processing state

    // Create updated pedido item
    const currentItem = this.currentPedidoItem;
    if (!currentItem) return;

    const updatedItem = new PedidoItem();
    Object.assign(updatedItem, currentItem);

    // Update rejection fields
    updatedItem.motivoRechazoRecepcionNota = formValue.isRejected && formValue.motivoRechazo?.length > 0
      ? MotivoHelper.combineMotivos(formValue.motivoRechazo) 
      : '';
    updatedItem.obsRecepcionNota = formValue.isRejected ? (formValue.observaciones || '').toUpperCase() : '';
    
    // Set cancelado = true when item is rejected
    updatedItem.cancelado = formValue.isRejected;

    // Save the updated item
    this.pedidoService.onSaveItem(updatedItem.toInput()).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.updateComputedProperties(); // Update UI when processing completes
        
        const message = formValue.isRejected 
          ? 'Item marcado como rechazado y cancelado exitosamente'
          : 'Rechazo del item removido exitosamente';
        this.notificacionService.openSucess(message);
        
        const result: ItemStatusDialogResult = { 
          updated: true, 
          pedidoItem: response,
          motivoRechazoRecepcionNota: response.motivoRechazoRecepcionNota,
          obsRecepcionNota: response.obsRecepcionNota,
          cancelado: response.cancelado
        };

        if (this.isEmbedded) {
          this.embeddedSaved.emit(result);
        } else {
          this.dialogRef?.close(result);
        }
      },
      error: () => {
        this.isProcessing = false;
        this.updateComputedProperties(); // Update UI when processing fails
        this.notificacionService.openWarn('Error al actualizar estado del item');
      }
    });
  }

  private getCurrentPedidoItem(): PedidoItem | null {
    return this.isEmbedded ? this.embeddedPedidoItem : this.data?.pedidoItem || null;
  }

  private getCurrentIsReadOnly(): boolean {
    return this.isEmbedded ? this.embeddedIsReadOnly : this.data?.isReadOnly || false;
  }
} 