import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { NotaRecepcionAgrupada } from '../../../../nota-recepcion/nota-recepcion-agrupada/nota-recepcion-agrupada.model';
import { Pedido } from '../../../../edit-pedido/pedido.model';
import { FormaPago } from '../../../../../../financiero/forma-pago/forma-pago.model';
import { FormaPagoService } from '../../../../../../financiero/forma-pago/forma-pago.service';

export interface ImprimirSolicitudPagoDialogData {
  grupo: NotaRecepcionAgrupada;
  pedido: Pedido;
}

export interface ImprimirSolicitudPagoDialogResult {
  accion: 'CERRAR' | 'IMPRIMIR';
  datosImpresion?: {
    proveedorNombre: string;
    fechaDePago: Date;
    formaPago: FormaPago;
    nominal: boolean;
    tipoImpresion: boolean; // true = PDF, false = Ticket
  };
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-imprimir-solicitud-pago-dialog',
  templateUrl: './imprimir-solicitud-pago-dialog.component.html',
  styleUrls: ['./imprimir-solicitud-pago-dialog.component.scss']
})
export class ImprimirSolicitudPagoDialogComponent implements OnInit {

  grupo: NotaRecepcionAgrupada;
  pedido: Pedido;
  
  // Form
  impresionForm: FormGroup;
  
  // Data arrays
  formasPago: FormaPago[] = [];
  isLoadingFormasPago = false;
  
  // Computed properties for template
  solicitudPagoIdComputed = '';
  proveedorNombreComputed = '';
  cantidadNotasComputed = 0;
  valorTotalComputed = '';
  monedaSymbolComputed = 'Gs.';
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ImprimirSolicitudPagoDialogData,
    private dialogRef: MatDialogRef<ImprimirSolicitudPagoDialogComponent>,
    private formBuilder: FormBuilder,
    private formaPagoService: FormaPagoService
  ) {
    this.grupo = data.grupo;
    this.pedido = data.pedido;
  }

  ngOnInit(): void {
    this.computeBasicInfo();
    this.loadFormasPago();
    this.buildForm();
    this.setupFormSubscriptions();
  }
  
  private computeBasicInfo(): void {
    this.solicitudPagoIdComputed = this.grupo?.solicitudPago?.id?.toString() || 'N/A';
    this.proveedorNombreComputed = this.grupo?.proveedor?.persona?.nombre || 'N/A';
    this.cantidadNotasComputed = this.grupo?.cantNotas || 0;
    this.monedaSymbolComputed = this.pedido?.moneda?.simbolo || 'Gs.';
    this.valorTotalComputed = this.formatCurrency(this.grupo?.valorTotal || 0);
  }
  
  private loadFormasPago(): void {
    this.isLoadingFormasPago = true;
    this.formaPagoService.onGetAllFormaPago()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (formasPago: FormaPago[]) => {
          this.formasPago = formasPago || [];
          this.isLoadingFormasPago = false;
          
          // Select the formaPago from pedido after loading all options
          this.selectPedidoFormaPago();
        },
        error: (error) => {
          console.error('Error loading formas de pago:', error);
          this.formasPago = [];
          this.isLoadingFormasPago = false;
        }
      });
  }
  
  private selectPedidoFormaPago(): void {
    if (this.pedido?.formaPago && this.formasPago.length > 0 && this.impresionForm) {
      // Find the matching formaPago by ID
      const matchingFormaPago = this.formasPago.find(fp => fp.id === this.pedido.formaPago.id);
      
      if (matchingFormaPago) {
        // Update the form control with the matching object from the loaded list
        this.impresionForm.get('formaPago')?.setValue(matchingFormaPago);
        
        // Trigger the form subscription to handle nominal field logic
        this.handleFormaPagoChange(matchingFormaPago);
      }
    }
  }

  private buildForm(): void {
    // Calculate fechaDePago
    const fechaDePago = this.calculateFechaDePago();
    
    this.impresionForm = this.formBuilder.group({
      proveedorNombre: [this.grupo?.proveedor?.persona?.nombre || '', [Validators.required, Validators.maxLength(100)]],
      fechaDePago: [fechaDePago, Validators.required],
      formaPago: [this.pedido?.formaPago, Validators.required],
      nominal: [true], // Default true
      tipoImpresion: [true] // Default true (PDF)
    });
  }
  
  private setupFormSubscriptions(): void {
    // Watch formaPago changes to show/hide nominal field
    this.impresionForm.get('formaPago')?.valueChanges.subscribe((formaPago: FormaPago) => {
      this.handleFormaPagoChange(formaPago);
    });
    
    // Watch nominal changes to enable/disable proveedorNombre
    this.impresionForm.get('nominal')?.valueChanges.subscribe((nominal: boolean) => {
      this.handleNominalChange(nominal);
    });
    
    // Initial setup
    this.handleFormaPagoChange(this.impresionForm.get('formaPago')?.value);
  }
  
  private calculateFechaDePago(): Date {
    const today = new Date();
    const plazoCredito = this.pedido?.plazoCredito || 0;
    
    if (plazoCredito > 0) {
      const fechaPago = new Date(today);
      fechaPago.setDate(fechaPago.getDate() + plazoCredito);
      return fechaPago;
    }
    
    return today;
  }
  
  private handleFormaPagoChange(formaPago: FormaPago): void {
    // Show nominal field only if formaPago descripcion is "CHEQUE"
    const isCheque = formaPago?.descripcion?.toUpperCase() === 'CHEQUE';
    
    if (isCheque) {
      // Enable nominal field and handle its current value
      this.handleNominalChange(this.impresionForm.get('nominal')?.value);
    } else {
      // Enable proveedorNombre when not cheque
      this.impresionForm.get('proveedorNombre')?.enable();
    }
  }
  
  private handleNominalChange(nominal: boolean): void {
    const formaPago = this.impresionForm.get('formaPago')?.value;
    const isCheque = formaPago?.descripcion?.toUpperCase() === 'CHEQUE';
    
    if (isCheque) {
      if (nominal) {
        this.impresionForm.get('proveedorNombre')?.enable();
      } else {
        this.impresionForm.get('proveedorNombre')?.disable();
      }
    }
  }
  
  // Utility methods
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount).replace('PYG', this.monedaSymbolComputed);
  }
  
  // Template helper methods
  get isFormaPagoCheque(): boolean {
    const formaPago = this.impresionForm?.get('formaPago')?.value;
    return formaPago?.descripcion?.toUpperCase() === 'CHEQUE';
  }
  
  get tipoImpresionText(): string {
    const tipoImpresion = this.impresionForm?.get('tipoImpresion')?.value;
    return tipoImpresion ? 'PDF' : 'Ticket';
  }

  onCerrar(): void {
    const result: ImprimirSolicitudPagoDialogResult = {
      accion: 'CERRAR'
    };
    this.dialogRef.close(result);
  }

  onImprimir(): void {
    if (this.impresionForm.invalid) {
      this.impresionForm.markAllAsTouched();
      return;
    }

    const formValue = this.impresionForm.value;
    
    // Asegurar que siempre se envíe el proveedorNombre, incluso si el campo está deshabilitado
    const proveedorNombre = formValue.proveedorNombre || 
                           this.impresionForm.get('proveedorNombre')?.value || 
                           this.grupo?.proveedor?.persona?.nombre || '';
    
    const result: ImprimirSolicitudPagoDialogResult = {
      accion: 'IMPRIMIR',
      datosImpresion: {
        proveedorNombre: proveedorNombre,
        fechaDePago: formValue.fechaDePago,
        formaPago: formValue.formaPago,
        nominal: formValue.nominal,
        tipoImpresion: formValue.tipoImpresion
      }
    };
    this.dialogRef.close(result);
  }
  
  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.impresionForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }
  
  getFieldError(fieldName: string): string {
    const field = this.impresionForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }
} 