import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { Pedido } from '../../../../edit-pedido/pedido.model';
import { NotaRecepcion } from '../../../../nota-recepcion/nota-recepcion.model';
import { NotaRecepcionAgrupada } from '../../../../nota-recepcion/nota-recepcion-agrupada/nota-recepcion-agrupada.model';
import { GenericCrudService } from '../../../../../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../../../../../notificacion-snackbar.service';
import { CrearGrupoYAsignarGQL } from '../../graphql/crearGrupoYAsignar';

export interface CrearGrupoDialogData {
  pedido: Pedido;
  notasSeleccionadas: NotaRecepcion[];
}

export interface CrearGrupoDialogResult {
  grupoCreado: NotaRecepcionAgrupada;
  notasAfectadas: NotaRecepcion[];
  accion: 'CREAR' | 'CANCELAR';
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-crear-grupo-dialog',
  templateUrl: './crear-grupo-dialog.component.html',
  styleUrls: ['./crear-grupo-dialog.component.scss']
})
export class CrearGrupoDialogComponent implements OnInit, OnDestroy {

  form: FormGroup;
  processing = false;
  
  // Computed properties for template display
  proveedorNombre = '';
  totalNotas = 0;
  valorTotal = 0;
  valorTotalDisplay = '';
  
  // Form validation computed properties
  isFormValidComputed = false;
  
  // Error message computed properties
  sucursalErrorMessage = '';
  descripcionErrorMessage = '';
  
  // Enhanced notas for display
  notasDisplay: {
    numero: string;
    fecha: string;
    valor: number;
    valorDisplay: string;
    cantidadItens: number;
  }[] = [];

  // Available sucursales for selection
  sucursalesDisponibles: any[] = [];
  loadingSucursales = false;

  // Table columns
  displayedColumns: string[] = ['numero', 'fecha', 'items', 'valor'];

  constructor(
    public dialogRef: MatDialogRef<CrearGrupoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CrearGrupoDialogData,
    private formBuilder: FormBuilder,
    private genericCrudService: GenericCrudService,
    private notificacionService: NotificacionSnackbarService,
    private crearGrupoYAsignarGQL: CrearGrupoYAsignarGQL
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    this.computeDisplayData();
    this.loadSucursales();
    this.setupFormValidation();
  }

  ngOnDestroy(): void {
    // Cleanup handled by UntilDestroy
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      sucursalId: [''], // Made optional - no Validators.required
      descripcion: ['', [Validators.maxLength(500)]]
    });
  }

  private computeDisplayData(): void {
    const { pedido, notasSeleccionadas } = this.data;
    
    // Basic info
    this.proveedorNombre = pedido.proveedor?.persona?.nombre || 'No especificado';
    this.totalNotas = notasSeleccionadas.length;
    this.valorTotal = notasSeleccionadas.reduce((sum, nota) => sum + (nota.valor || 0), 0);
    this.valorTotalDisplay = this.formatCurrency(this.valorTotal);
    
    // Enhanced notas for display
    this.notasDisplay = notasSeleccionadas.map(nota => ({
      numero: String(nota.numero || 'Sin número'),
      fecha: this.formatDate(nota.fecha),
      valor: nota.valor || 0,
      valorDisplay: this.formatCurrency(nota.valor || 0),
      cantidadItens: nota.cantidadItens || 0
    }));
  }

  private setupFormValidation(): void {
    // Update error messages when form values change
    this.form.statusChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateErrorMessages();
    });
    
    // Initial error message computation
    this.updateErrorMessages();
  }

  private updateErrorMessages(): void {
    // Update sucursal error message
    const sucursalControl = this.form.get('sucursalId');
    this.sucursalErrorMessage = ''; // Sucursal is now optional, so no validation errors
    
    // Update descripcion error message
    const descripcionControl = this.form.get('descripcion');
    if (descripcionControl?.hasError('maxlength')) {
      this.descripcionErrorMessage = 'La descripción no puede exceder 500 caracteres';
    } else {
      this.descripcionErrorMessage = '';
    }
    
    // Update form validation
    this.isFormValidComputed = this.form.valid && !this.processing;
  }

  private loadSucursales(): void {
    this.loadingSucursales = true;
    // TODO: Implement sucursales loading from backend
    // For now, use default sucursal from pedido
    setTimeout(() => {
      const pedidoWithSucursal = this.data.pedido as any;
      if (pedidoWithSucursal.sucursal) {
        this.sucursalesDisponibles = [pedidoWithSucursal.sucursal];
        this.form.patchValue({
          sucursalId: pedidoWithSucursal.sucursal.id
        });
      }
      this.loadingSucursales = false;
      this.updateErrorMessages(); // Update after loading
    }, 300);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount).replace('PYG', 'Gs.');
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-PY');
  }

  // Form validation is now handled through computed properties

  // Actions
  onCrearGrupo(): void {
    if (!this.isFormValidComputed) {
      this.form.markAllAsTouched();
      this.updateErrorMessages(); // Update computed properties when form is marked as touched
      return;
    }

    if (this.totalNotas === 0) {
      this.notificacionService.openWarn('Debe seleccionar al menos una nota');
      return;
    }

    const formValue = this.form.value;
    this.processing = true;

    const mutationVariables = {
      proveedorId: this.data.pedido.proveedor.id,
      sucursalId: formValue.sucursalId || undefined, // Send undefined if no sucursal selected
      notaRecepcionIds: this.data.notasSeleccionadas.map(nota => nota.id),
      descripcion: formValue.descripcion || undefined
    };

    this.genericCrudService.onCustomMutation(
      this.crearGrupoYAsignarGQL,
      mutationVariables
    ).pipe(untilDestroyed(this)).subscribe({
      next: (result) => {
        // do not use data, use result directly
        const response = result;
        if (response?.success) {
          this.notificacionService.openSucess(
            `Grupo creado exitosamente con ${response.notasAfectadas.length} notas`
          );
          
          const dialogResult: CrearGrupoDialogResult = {
            grupoCreado: response.grupo,
            notasAfectadas: response.notasAfectadas,
            accion: 'CREAR'
          };
          
          this.dialogRef.close(dialogResult);
        } else {
          this.notificacionService.openWarn(
            response?.mensaje || 'Error al crear el grupo'
          );
          this.processing = false;
        }
      },
      error: (error) => {
        console.error('Error creating group:', error);
        this.notificacionService.openWarn('Error al crear el grupo');
        this.processing = false;
      }
    });
  }

  onCancelar(): void {
    const result: CrearGrupoDialogResult = {
      grupoCreado: {} as NotaRecepcionAgrupada,
      notasAfectadas: [],
      accion: 'CANCELAR'
    };
    this.dialogRef.close(result);
  }

  // Note: Error messages are now handled through computed properties in updateErrorMessages()
  // No functions used in templates to follow Angular performance best practices
} 