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

  // Form group
  statusForm = new FormGroup({
    motivoRechazo: new FormControl([], [Validators.required]),
    isRejected: new FormControl(false),
    observaciones: new FormControl('', [Validators.maxLength(500)])
  });

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

  get isRejected(): boolean {
    return this.statusForm.get('isRejected')?.value || false;
  }

  get canSave(): boolean {
    if (this.isProcessing || this.currentIsReadOnly || !this.statusForm.valid) {
      return false;
    }

    const isRejected = this.isRejected;
    const hasMotivos = this.statusForm.get('motivoRechazo')?.value?.length > 0;
    
    return !isRejected || (isRejected && hasMotivos);
  }

  private initializeComponent(): void {
    // Initialize UI state
    this.showDialogHeader = !this.isEmbedded;
    this.currentIsReadOnly = this.getCurrentIsReadOnly();
    this.currentPedidoItem = this.getCurrentPedidoItem();
    
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

    // Load current status
    this.loadCurrentStatus();
  }

  private loadCurrentStatus(): void {
    const item = this.currentPedidoItem;
    if (!item) return;

    const existingMotivoRechazo = MotivoHelper.separateMotivos(item.motivoRechazoRecepcionNota || '');
    const hasRechazo = existingMotivoRechazo.length > 0;

    this.statusForm.patchValue({
      motivoRechazo: existingMotivoRechazo,
      isRejected: hasRechazo,
      observaciones: item.observacionesRecepcionNota || ''
    });

    if (this.currentIsReadOnly) {
      this.statusForm.disable();
    }
  }

  private setupFormSubscriptions(): void {
    // Handle isRejected changes
    this.statusForm.get('isRejected')?.valueChanges.subscribe(isRejected => {
      if (!isRejected) {
        this.statusForm.get('motivoRechazo')?.setValue([]);
        this.statusForm.get('observaciones')?.setValue('');
      }
      this.updateFormState();
    });
  }

  private updateFormState(): void {
    const isRejected = this.isRejected;
    
    // Update form validation
    if (isRejected) {
      this.statusForm.get('motivoRechazo')?.enable();
      this.statusForm.get('observaciones')?.enable();
    } else {
      this.statusForm.get('motivoRechazo')?.disable();
      this.statusForm.get('observaciones')?.disable();
    }
  }

  onCancel(): void {
    if (this.isEmbedded) {
      this.embeddedCancelled.emit();
    } else {
      this.dialogRef?.close({ updated: false } as ItemStatusDialogResult);
    }
  }

  onSave(): void {
    if (!this.canSave || this.isProcessing) {
      return;
    }

    const formValue = this.statusForm.value;
    
    // Validate rejection requirements
    if (formValue.isRejected && (!formValue.motivoRechazo || formValue.motivoRechazo.length === 0)) {
      this.notificacionService.openWarn('Debe especificar el motivo de rechazo');
      return;
    }

    this.isProcessing = true;

    // Create updated pedido item
    const currentItem = this.currentPedidoItem;
    if (!currentItem) return;

    const updatedItem = new PedidoItem();
    Object.assign(updatedItem, currentItem);

    // Update rejection fields
    updatedItem.motivoRechazoRecepcionNota = formValue.isRejected && formValue.motivoRechazo?.length > 0
      ? MotivoHelper.combineMotivos(formValue.motivoRechazo) 
      : '';
    updatedItem.observacionesRecepcionNota = formValue.isRejected ? (formValue.observaciones || '').toUpperCase() : '';

    // Save the updated item
    this.pedidoService.onSaveItem(updatedItem.toInput()).subscribe({
      next: (response) => {
        this.isProcessing = false;
        
        const message = formValue.isRejected 
          ? 'Item marcado como rechazado exitosamente'
          : 'Rechazo del item removido exitosamente';
        this.notificacionService.openSucess(message);
        
        const result: ItemStatusDialogResult = { 
          updated: true, 
          pedidoItem: response 
        };

        if (this.isEmbedded) {
          this.embeddedSaved.emit(result);
        } else {
          this.dialogRef?.close(result);
        }
      },
      error: () => {
        this.isProcessing = false;
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