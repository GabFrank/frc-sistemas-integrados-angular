import { Component, Inject, OnInit, Input, Output, EventEmitter, Optional } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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

@UntilDestroy({ checkProperties: true })
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

  // Form group - only for rejection management
  statusForm = new FormGroup({
    motivoRechazo: new FormControl([]),
    isRejected: new FormControl(false)
  });

  // Available motivos for rejection only
  motivosRechazo = Object.values(MotivoRechazoRecepcionNota);

  // Labels for display
  motivoRechazoLabels = MotivoHelper.getMotivoRechazoLabels();

  // Processing state
  isProcessing = false;

  // Properties for template (instead of getters for performance)
  currentPedidoItemForTemplate: PedidoItem | null = null;
  currentIsReadOnlyForTemplate: boolean = false;
  showDialogHeader: boolean = true;
  canSave: boolean = false;
  dialogTitle: string = '';
  productDescription: string = '';
  isCurrentlyRejected: boolean = false;

  constructor(
    @Optional() public dialogRef: MatDialogRef<ItemStatusDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: ItemStatusDialogData | null,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.updateTemplateProperties();
    this.loadCurrentStatus();
    this.setupFormSubscriptions();
  }

  private updateTemplateProperties(): void {
    const itemData = this.getCurrentPedidoItem();
    if (itemData) {
      // Convert plain object to PedidoItem instance if needed
      if (itemData instanceof PedidoItem) {
        this.currentPedidoItemForTemplate = itemData;
      } else {
        const pedidoItem = new PedidoItem();
        Object.assign(pedidoItem, itemData);
        this.currentPedidoItemForTemplate = pedidoItem;
      }
    } else {
      this.currentPedidoItemForTemplate = null;
    }
    
    this.currentIsReadOnlyForTemplate = this.getCurrentIsReadOnly();
    
    // Update all other template properties
    this.showDialogHeader = !this.isEmbedded;
    this.canSave = !this.isProcessing && !this.currentIsReadOnlyForTemplate && this.statusForm.valid;
    this.dialogTitle = this.currentIsReadOnlyForTemplate 
      ? 'Ver Estado de Rechazo'
      : 'Gestionar Rechazo del Item';
    
    const item = this.currentPedidoItemForTemplate;
    this.productDescription = item 
      ? `${item.producto?.descripcion || 'Producto'} - ${item.presentacionRecepcionNota?.cantidad || item.presentacionCreacion?.cantidad || 1}`
      : 'Producto';
    
    this.isCurrentlyRejected = item 
      ? !!(item.motivoRechazoRecepcionNota && item.motivoRechazoRecepcionNota.trim())
      : false;
  }

  private loadCurrentStatus(): void {
    const itemData = this.getCurrentPedidoItem();
    if (!itemData) return;
    
    // Convert plain object to PedidoItem instance if needed
    let item: PedidoItem;
    if (itemData instanceof PedidoItem) {
      item = itemData;
    } else {
      item = new PedidoItem();
      Object.assign(item, itemData);
    }
    
    // Load existing rejection motivos
    const existingMotivoRechazo = MotivoHelper.separateMotivos(item.motivoRechazoRecepcionNota || '');
    const hasRechazo = existingMotivoRechazo.length > 0;

    this.statusForm.patchValue({
      motivoRechazo: existingMotivoRechazo,
      isRejected: hasRechazo
    });

    // Disable form if read-only
    if (this.getCurrentIsReadOnly()) {
      this.statusForm.disable();
    }
  }

  private setupFormSubscriptions(): void {
    // Clear rejection motivos when isRejected is false
    this.statusForm.get('isRejected')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(isRejected => {
        if (!isRejected) {
          this.statusForm.get('motivoRechazo')?.setValue([]);
        }
      });

    // Update template properties when form validity changes
    this.statusForm.statusChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateTemplateProperties();
      });
  }

  onSave(): void {
    if (this.statusForm.invalid || this.isProcessing) {
      return;
    }

    const formValue = this.statusForm.value;
    
    // Validate rejection requirements
    if (formValue.isRejected && (!formValue.motivoRechazo || formValue.motivoRechazo.length === 0)) {
      this.notificacionService.openWarn('Debe especificar el motivo de rechazo');
      return;
    }

    this.isProcessing = true;
    // Update template properties when processing state changes
    this.updateTemplateProperties();

    // Create updated pedido item
    const currentItem = this.getCurrentPedidoItem();
    if (!currentItem) return;

    const updatedItem = new PedidoItem();
    Object.assign(updatedItem, currentItem);

    // Update only the rejection field
    updatedItem.motivoRechazoRecepcionNota = formValue.isRejected && formValue.motivoRechazo?.length > 0
      ? MotivoHelper.combineMotivos(formValue.motivoRechazo) 
      : '';

    // Save the updated item
    this.pedidoService.onSaveItem(updatedItem.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.isProcessing = false;
          // Update template properties when processing state changes
          this.updateTemplateProperties();
          
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
          // Update template properties when processing state changes
          this.updateTemplateProperties();
          this.notificacionService.openWarn('Error al actualizar estado del item');
        }
      });
  }

  onCancel(): void {
    if (this.isEmbedded) {
      this.embeddedCancelled.emit();
    } else {
      this.dialogRef?.close({ updated: false } as ItemStatusDialogResult);
    }
  }

  // Helper methods to get current values from either embedded or dialog data
  private getCurrentPedidoItem(): PedidoItem | null {
    return this.isEmbedded ? this.embeddedPedidoItem : this.data?.pedidoItem || null;
  }

  private getCurrentIsReadOnly(): boolean {
    return this.isEmbedded ? this.embeddedIsReadOnly : this.data?.isReadOnly || false;
  }

  getMotivoLabel(motivo: string): string {
    return MotivoHelper.getMotivoLabel(motivo, true);
  }
} 