// import { Component, Inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
// import { MatButton } from '@angular/material/button';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';

// import { NotaProveedor, TipoDocumentoProveedor, EstadoNotaProveedor } from '../../nota-proveedor.model';
// import { Pedido } from '../../pedido.model';

// export interface AddEditNotaProveedorDialogData {
//   pedido: Pedido;
//   nota?: NotaProveedor;
//   isEdit: boolean;
//   title: string;
// }

// @Component({
//   selector: 'app-add-edit-nota-proveedor-dialog',
//   templateUrl: './add-edit-nota-proveedor-dialog.component.html',
//   styleUrls: ['./add-edit-nota-proveedor-dialog.component.scss']
// })
// export class AddEditNotaProveedorDialogComponent implements OnInit, OnDestroy {
//   @ViewChild('saveButton', { static: false }) saveButton!: MatButton;

//   private destroy$ = new Subject<void>();

//   notaForm: FormGroup;
  
//   // Computed properties
//   isEditComputed = false;
//   titleComputed = '';
//   isSaveDisabledComputed = true;
  
//   // Enums for templates
//   tiposDocumento = Object.values(TipoDocumentoProveedor);
//   TipoDocumentoProveedor = TipoDocumentoProveedor;

//   constructor(
//     private fb: FormBuilder,
//     public dialogRef: MatDialogRef<AddEditNotaProveedorDialogComponent>,
//     @Inject(MAT_DIALOG_DATA) public data: AddEditNotaProveedorDialogData
//   ) {
//     this.createForm();
//   }

//   ngOnInit(): void {
//     this.initializeData();
//     this.setupFormSubscriptions();
//     this.updateComputedProperties();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   private createForm(): void {
//     this.notaForm = this.fb.group({
//       tipoDocumento: ['', [Validators.required]],
//       numeroDocumento: ['', [Validators.required, Validators.minLength(3)]],
//       fechaEmision: ['', [Validators.required]],
//       fechaVencimiento: [''],
//       montoTotal: ['', [Validators.required, Validators.min(0.01)]],
//       observaciones: ['']
//     });
//   }

//   private initializeData(): void {
//     this.isEditComputed = this.data.isEdit;
//     this.titleComputed = this.data.title;

//     if (this.data.isEdit && this.data.nota) {
//       this.notaForm.patchValue({
//         tipoDocumento: this.data.nota.tipoDocumento,
//         numeroDocumento: this.data.nota.numeroDocumento,
//         fechaEmision: this.data.nota.fechaEmision,
//         fechaVencimiento: this.data.nota.fechaVencimiento,
//         montoTotal: this.data.nota.montoTotal,
//         observaciones: this.data.nota.observaciones
//       });
//     } else {
//       // Defaults para nuevo documento
//       this.notaForm.patchValue({
//         tipoDocumento: TipoDocumentoProveedor.FACTURA,
//         fechaEmision: new Date()
//       });
//     }
//   }

//   private setupFormSubscriptions(): void {
//     this.notaForm.valueChanges
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => {
//         this.updateComputedProperties();
//       });
//   }

//   private updateComputedProperties(): void {
//     this.isSaveDisabledComputed = this.notaForm.invalid;
//   }

//   // Navigation methods
//   onKeydown(event: KeyboardEvent, currentField: string): void {
//     if (event.key === 'Enter' && !event.shiftKey) {
//       event.preventDefault();
      
//       const currentControl = this.notaForm.get(currentField);
//       if (currentControl && !currentControl.valid) {
//         currentControl.markAsTouched();
//         this.updateComputedProperties();
//         return;
//       }

//       this.navigateToNextField(currentField);
//     }
//   }

//   private navigateToNextField(currentField: string): void {
//     const fieldOrder = [
//       'tipoDocumento',
//       'numeroDocumento', 
//       'fechaEmision',
//       'fechaVencimiento',
//       'montoTotal',
//       'observaciones'
//     ];

//     const currentIndex = fieldOrder.indexOf(currentField);
    
//     if (currentIndex < fieldOrder.length - 1) {
//       const nextField = fieldOrder[currentIndex + 1];
//       const nextElement = document.querySelector(`[formControlName="${nextField}"]`) as HTMLElement;
//       if (nextElement) {
//         setTimeout(() => nextElement.focus(), 10);
//       }
//     } else {
//       // Focus save button
//       if (this.saveButton && !this.isSaveDisabledComputed) {
//         setTimeout(() => this.saveButton._elementRef.nativeElement.focus(), 10);
//       }
//     }
//   }

//   onTipoDocumentoSelectionChange(): void {
//     // Navigate to next field after selection
//     setTimeout(() => {
//       this.navigateToNextField('tipoDocumento');
//     }, 100);
//   }

//   onSave(): void {
//     if (this.notaForm.invalid) {
//       this.notaForm.markAllAsTouched();
//       this.updateComputedProperties();
//       return;
//     }

//     const formData = this.notaForm.value;

//     const nota = new NotaProveedor();
//     nota.id = this.data.isEdit ? this.data.nota!.id : undefined;
//     nota.pedido = this.data.pedido;
//     nota.tipoDocumento = formData.tipoDocumento;
//     nota.numeroDocumento = formData.numeroDocumento?.toUpperCase();
//     nota.fechaEmision = formData.fechaEmision;
//     nota.fechaVencimiento = formData.fechaVencimiento;
//     nota.montoTotal = parseFloat(formData.montoTotal);
//     nota.estado = EstadoNotaProveedor.PENDIENTE_CONCILIACION;
//     nota.observaciones = formData.observaciones?.toUpperCase();
//     nota.fechaRecepcion = new Date();
//     nota.usuarioRecepcion = null; // TODO: Usuario actual
//     nota.creadoEn = this.data.isEdit ? this.data.nota!.creadoEn : new Date();
//     nota.usuarioCreacion = this.data.isEdit ? this.data.nota!.usuarioCreacion : null; // TODO: Usuario actual
//     nota.diasVencimiento = 0;
//     nota.montoConciliado = 0;

//     this.dialogRef.close(nota);
//   }

//   onCancel(): void {
//     this.dialogRef.close();
//   }
// } 