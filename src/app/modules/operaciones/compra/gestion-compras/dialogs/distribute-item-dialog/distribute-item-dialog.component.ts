import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Producto } from '../../../../../productos/producto/producto.model';
import { PedidoItem } from '../../pedido-item.model';
import { PedidoItemDistribucion, PedidoItemDistribucionInput } from '../../pedido-item-distribucion.model';
import { Sucursal } from '../../../../../empresarial/sucursal/sucursal.model';
import { PedidoService } from '../../../pedido.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';

export interface DistributeItemDialogData {
  item: PedidoItem;
  distribuciones: PedidoItemDistribucion[];
  sucursalesInfluencia: Sucursal[];
  sucursalesEntrega: Sucursal[];
  title: string;
}

export interface DistributeItemDialogResult {
  success: boolean;
  action: 'save' | 'delete' | 'cancel';
  message?: string;
}

@Component({
  selector: 'app-distribute-item-dialog',
  templateUrl: './distribute-item-dialog.component.html',
  styleUrls: ['./distribute-item-dialog.component.scss']
})
export class DistributeItemDialogComponent implements OnInit {
  @ViewChild('guardarBtn') guardarBtn!: ElementRef;
  @ViewChild('cancelarBtn') cancelarBtn!: ElementRef;

  distribucionForm: FormGroup;
  
  // Modo de distribución
  distribuyePorPresentacion = true; // Por defecto distribución por presentación
  
  // Modo de borrado
  modoBorrado = false;
  distribucionesSeleccionadas: number[] = [];
  
  // Computed properties for template
  titleComputed = '';
  canSaveComputed = false;
  canDeleteComputed = false;
  totalAsignadoComputed = 0;
  cantidadSolicitadaComputed = 0;
  discrepanciaComputed = 0;
  hasDiscrepanciaComputed = false;
  discrepanciaTipoComputed: 'mayor' | 'menor' | 'igual' = 'igual';
  absDiscrepanciaComputed = 0;
  
  // Totales para mostrar según el modo seleccionado
  totalAsignadoMostrarComputed = 0;
  cantidadSolicitadaMostrarComputed = 0;
  discrepanciaMostrarComputed = 0;
  absDiscrepanciaMostrarComputed = 0;
  
  // Presentación info
  presentacionCreacionComputed = '';
  cantidadPorPresentacionComputed = 1;
  cantidadSolicitadaPorPresentacionComputed = 0;
  
  // Formatted values for template (avoid function calls)
  totalAsignadoFormattedComputed = '';
  discrepanciaFormattedComputed = '';
  absDiscrepanciaFormattedComputed = '';
  cantidadSolicitadaFormattedComputed = '';
  
  // Unidades para mostrar en el template
  unidadMostrarComputed = '';
  
  // Status classes and icons (avoid function calls)
  discrepanciaClassComputed = '';
  discrepanciaIconComputed = '';

  // Loading state
  savingComputed = false;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<DistributeItemDialogComponent>,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionSnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: DistributeItemDialogData
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Calcular propiedades de presentación ANTES de cargar distribuciones
    this.calculatePresentationProperties();
    this.loadDistribuciones();
    this.updateComputedProperties();
    this.setupFormSubscriptions();
  }

  private initializeForm(): void {
    this.distribucionForm = this.formBuilder.group({
      distribuciones: this.formBuilder.array([])
    });
  }

  private calculatePresentationProperties(): void {
    // Calcular información de la presentación ANTES de cargar distribuciones
    this.cantidadPorPresentacionComputed = this.data.item.presentacionCreacion?.cantidad || 1;
    this.presentacionCreacionComputed = this.data.item.presentacionCreacion?.descripcion || 'unidad';
    this.cantidadSolicitadaPorPresentacionComputed = this.data.item.cantidadSolicitada / this.cantidadPorPresentacionComputed;
  }

  private loadDistribuciones(): void {
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    
    // Clear existing controls
    while (distribucionesArray.length !== 0) {
      distribucionesArray.removeAt(0);
    }

    // Create a form control for each sucursal de influencia
    this.data.sucursalesInfluencia.forEach(sucursalInfluencia => {
      // Find existing distribution for this sucursal de influencia
      const existingDistribucion = this.data.distribuciones.find(d => d.sucursalInfluencia.nombre === sucursalInfluencia.nombre);
      
      // Cantidad asignada en unidades base
      const cantidadAsignadaUnidadBase = existingDistribucion ? existingDistribucion.cantidadAsignada : 0;
      
      // Convertir a presentación si es necesario
      const cantidadAsignada = this.distribuyePorPresentacion 
        ? cantidadAsignadaUnidadBase / this.cantidadPorPresentacionComputed
        : cantidadAsignadaUnidadBase;
      
      // Default delivery branch (same as influence branch or first delivery branch)
      const defaultSucursalEntrega = existingDistribucion ? 
        this.data.sucursalesEntrega.find(se => se.nombre === existingDistribucion.sucursalEntrega.nombre) :
        this.data.sucursalesEntrega[0];

      const distribucionGroup = this.formBuilder.group({
        sucursalInfluencia: [sucursalInfluencia.nombre, [Validators.required]],
        sucursalInfluenciaNombre: [sucursalInfluencia.nombre],
        sucursalEntrega: [defaultSucursalEntrega?.id, [Validators.required]],
        cantidadAsignada: [cantidadAsignada, [Validators.min(0)]],
        direccionInfluencia: [sucursalInfluencia.direccion || ''],
        seleccionado: [false], // Para el modo borrado
        distribucionId: [existingDistribucion?.id || null] // ID de la distribución existente
      });

      distribucionesArray.push(distribucionGroup);
    });
  }

  private setupFormSubscriptions(): void {
    this.distribucionForm.valueChanges.subscribe(() => {
      this.updateComputedProperties();
    });
  }

  private updateComputedProperties(): void {
    this.titleComputed = this.data.title;
    this.cantidadSolicitadaComputed = this.data.item.cantidadSolicitada;
    
    // Calcular información de la presentación
    this.calculatePresentationProperties();
    
    // Configurar la unidad para mostrar en el template
    this.unidadMostrarComputed = this.distribuyePorPresentacion ? this.presentacionCreacionComputed : 'unidades';
    
    // Calculate total assigned (siempre en unidades base para cálculos internos)
    const distribuciones = this.distribucionForm.get('distribuciones') as FormArray;
    this.totalAsignadoComputed = 0;

    distribuciones.controls.forEach(control => {
      const cantidadAsignada = control.get('cantidadAsignada')?.value || 0;
      
      // Si está distribuyendo por presentación, convertir a unidad base
      const cantidadEnUnidadBase = this.distribuyePorPresentacion
        ? cantidadAsignada * this.cantidadPorPresentacionComputed
        : cantidadAsignada;
        
      this.totalAsignadoComputed += cantidadEnUnidadBase;
    });

    // Calculate discrepancy (siempre en unidades base para validaciones)
    this.discrepanciaComputed = this.totalAsignadoComputed - this.cantidadSolicitadaComputed;
    this.absDiscrepanciaComputed = Math.abs(this.discrepanciaComputed);
    this.hasDiscrepanciaComputed = this.absDiscrepanciaComputed > 0.001; // Use small tolerance for floating point

    // Calcular totales para mostrar según el modo seleccionado
    if (this.distribuyePorPresentacion) {
      this.totalAsignadoMostrarComputed = this.totalAsignadoComputed / this.cantidadPorPresentacionComputed;
      this.cantidadSolicitadaMostrarComputed = this.cantidadSolicitadaPorPresentacionComputed;
      this.discrepanciaMostrarComputed = this.discrepanciaComputed / this.cantidadPorPresentacionComputed;
      this.absDiscrepanciaMostrarComputed = Math.abs(this.discrepanciaMostrarComputed);
    } else {
      this.totalAsignadoMostrarComputed = this.totalAsignadoComputed;
      this.cantidadSolicitadaMostrarComputed = this.cantidadSolicitadaComputed;
      this.discrepanciaMostrarComputed = this.discrepanciaComputed;
      this.absDiscrepanciaMostrarComputed = this.absDiscrepanciaComputed;
    }

    if (this.discrepanciaComputed > 0) {
      this.discrepanciaTipoComputed = 'mayor';
    } else if (this.discrepanciaComputed < 0) {
      this.discrepanciaTipoComputed = 'menor';
    } else {
      this.discrepanciaTipoComputed = 'igual';
    }

    // Form is valid if it passes validation and has no negative values
    this.canSaveComputed = !this.modoBorrado && this.distribucionForm.valid && this.allQuantitiesValid();
    this.canDeleteComputed = this.modoBorrado && this.distribucionesSeleccionadas.length > 0;
    
    // Calculate formatted values using the display values
    this.totalAsignadoFormattedComputed = this.totalAsignadoMostrarComputed.toFixed(2);
    this.discrepanciaFormattedComputed = this.discrepanciaMostrarComputed.toFixed(2);
    this.absDiscrepanciaFormattedComputed = this.absDiscrepanciaMostrarComputed.toFixed(2);
    this.cantidadSolicitadaFormattedComputed = this.cantidadSolicitadaMostrarComputed.toFixed(2);
    
    // Calculate status classes and icons (avoid function calls in template)
    if (!this.hasDiscrepanciaComputed) {
      this.discrepanciaClassComputed = 'discrepancia-ok';
      this.discrepanciaIconComputed = 'check_circle';
    } else {
      if (this.discrepanciaTipoComputed === 'mayor') {
        this.discrepanciaClassComputed = 'discrepancia-mayor';
        this.discrepanciaIconComputed = 'warning';
      } else {
        this.discrepanciaClassComputed = 'discrepancia-menor';
        this.discrepanciaIconComputed = 'error';
      }
    }
  }

  private allQuantitiesValid(): boolean {
    const distribuciones = this.distribucionForm.get('distribuciones') as FormArray;
    return distribuciones.controls.every(control => {
      const cantidad = control.get('cantidadAsignada')?.value || 0;
      return cantidad >= 0;
    });
  }

  get distribucionesArray(): FormArray {
    return this.distribucionForm.get('distribuciones') as FormArray;
  }

  // Cambio de modo de distribución
  onToggleDistribucionMode(): void {
    this.distribuyePorPresentacion = !this.distribuyePorPresentacion;
    
    // Calcular propiedades de presentación ANTES de recargar distribuciones
    this.calculatePresentationProperties();
    // Recargar distribuciones con el nuevo modo
    this.loadDistribuciones();
    this.updateComputedProperties();
  }

  // Modo borrado
  onToggleBorradoMode(): void {
    this.modoBorrado = !this.modoBorrado;
    this.distribucionesSeleccionadas = [];
    
    if (this.modoBorrado) {
      // Limpiar selecciones al entrar en modo borrado
      const distribuciones = this.distribucionForm.get('distribuciones') as FormArray;
      distribuciones.controls.forEach(control => {
        control.get('seleccionado')?.setValue(false);
      });
    }
    
    this.updateComputedProperties();
  }

  onToggleSeleccion(index: number): void {
    const distribuciones = this.distribucionForm.get('distribuciones') as FormArray;
    const control = distribuciones.at(index);
    const seleccionado = control.get('seleccionado')?.value;
    
    control.get('seleccionado')?.setValue(!seleccionado);
    
    // Actualizar lista de seleccionados
    this.distribucionesSeleccionadas = [];
    distribuciones.controls.forEach((ctrl, idx) => {
      if (ctrl.get('seleccionado')?.value) {
        const distribucionId = ctrl.get('distribucionId')?.value;
        if (distribucionId) {
          this.distribucionesSeleccionadas.push(distribucionId);
        }
      }
    });
    
    this.updateComputedProperties();
  }

  // Distribution actions
  onDistribuirUniforme(): void {
    const cantidadBase = this.distribuyePorPresentacion 
      ? this.cantidadSolicitadaPorPresentacionComputed 
      : this.cantidadSolicitadaComputed;
      
    const cantidadPorSucursal = cantidadBase / this.data.sucursalesInfluencia.length;
    const distribuciones = this.distribucionForm.get('distribuciones') as FormArray;
    
    distribuciones.controls.forEach(control => {
      control.get('cantidadAsignada')?.setValue(cantidadPorSucursal);
    });
  }

  onLimpiarDistribuciones(): void {
    const distribuciones = this.distribucionForm.get('distribuciones') as FormArray;
    
    distribuciones.controls.forEach(control => {
      control.get('cantidadAsignada')?.setValue(0);
    });
  }

  onAsignarTotal(): void {
    const cantidadBase = this.distribuyePorPresentacion 
      ? this.cantidadSolicitadaPorPresentacionComputed 
      : this.cantidadSolicitadaComputed;
      
    // Assign all quantity to first sucursal and clear others
    const distribuciones = this.distribucionForm.get('distribuciones') as FormArray;
    
    distribuciones.controls.forEach((control, index) => {
      if (index === 0) {
        control.get('cantidadAsignada')?.setValue(cantidadBase);
      } else {
        control.get('cantidadAsignada')?.setValue(0);
      }
    });
  }

  // Keyboard navigation for quantity inputs
  onCantidadKeydown(event: KeyboardEvent, currentIndex: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const distribuciones = this.distribucionForm.get('distribuciones') as FormArray;
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < distribuciones.length) {
        // Focus next quantity input
        const nextInput = document.querySelector(`input[formControlName="cantidadAsignada"]:nth-of-type(${nextIndex + 1})`) as HTMLElement;
        nextInput?.focus();
      } else {
        // Focus save button if this is the last input
        this.guardarBtn?.nativeElement.focus();
      }
    }
  }

  // Dialog actions
  onSave(): void {
    if (this.modoBorrado) {
      // Modo borrado - eliminar distribuciones seleccionadas
      this.onDeleteDistribuciones();
      return;
    }

    if (!this.canSaveComputed) {
      this.markFormGroupTouched();
      return;
    }

    if (this.savingComputed) {
      return;
    }

    this.savingComputed = true;

    // Check for discrepancy and ask user if they want to update the original quantity
    // for now, do not let user to continue if there is a discrepancy
    if (this.hasDiscrepanciaComputed) {
      const message = this.discrepanciaMostrarComputed > 0 
        ? `La cantidad distribuida (${this.totalAsignadoFormattedComputed} ${this.unidadMostrarComputed}) es mayor a la solicitada (${this.cantidadSolicitadaFormattedComputed} ${this.unidadMostrarComputed}).`
        : `La cantidad distribuida (${this.totalAsignadoFormattedComputed} ${this.unidadMostrarComputed}) es menor a la solicitada (${this.cantidadSolicitadaFormattedComputed} ${this.unidadMostrarComputed}).`;
      this.notificacionService.openAlgoSalioMal(message);
      return;

      // if (confirm(message)) {
      //   // User confirmed to update the original quantity
      //   // This would be handled by the parent component
      // }
    }

    const formValue = this.distribucionForm.value;
    const distribuciones: PedidoItemDistribucionInput[] = [];
    const distribucionesToDelete: number[] = [];

    formValue.distribuciones.forEach((d: any) => {
      const distribucionId = d.distribucionId;
      const cantidadAsignada = parseFloat(d.cantidadAsignada) || 0;
      
      if (cantidadAsignada > 0) {
        // Crear o actualizar distribución
        const sucursalInfluencia = this.data.sucursalesInfluencia.find(si => si.nombre === d.sucursalInfluencia);
        const sucursalEntrega = this.data.sucursalesEntrega.find(se => se.id === d.sucursalEntrega);
        
        // Convertir la cantidad a unidades base si se está distribuyendo por presentación
        const cantidadEnUnidadBase = this.distribuyePorPresentacion
          ? cantidadAsignada * this.cantidadPorPresentacionComputed
          : cantidadAsignada;
        
        let distribucion = new PedidoItemDistribucion();
        distribucion.id = distribucionId || undefined;
        distribucion.pedidoItem = this.data.item;
        distribucion.sucursalInfluencia = sucursalInfluencia!;
        distribucion.sucursalEntrega = sucursalEntrega!;
        distribucion.cantidadAsignada = cantidadEnUnidadBase;
        distribuciones.push(distribucion.toInput());
      } else if (distribucionId) {
        // Si la cantidad es 0 y existe un ID, marcar para eliminación
        distribucionesToDelete.push(distribucionId);
      }
    });

    // Ejecutar operaciones de guardado y eliminación
    this.executeSaveOperations(distribuciones, distribucionesToDelete);
  }

  private executeSaveOperations(distribuciones: PedidoItemDistribucionInput[], distribucionesToDelete: number[]): void {
    let operationsCompleted = 0;
    let totalOperations = 0;
    let hasErrors = false;

    // Contar operaciones totales
    if (distribuciones.length > 0) totalOperations++;
    if (distribucionesToDelete.length > 0) totalOperations++;

    if (totalOperations === 0) {
      // No hay operaciones que realizar
      this.savingComputed = false;
      this.dialogRef.close({ success: true, action: 'save' });
      return;
    }

    const checkCompletion = () => {
      operationsCompleted++;
      if (operationsCompleted >= totalOperations) {
        this.savingComputed = false;
        if (hasErrors) {
          this.dialogRef.close({ success: false, action: 'save' });
        } else {
          this.notificacionService.openSucess("Distribuciones guardadas exitosamente");
          this.dialogRef.close({ success: true, action: 'save' });
        }
      }
    };

    // Guardar distribuciones con cantidad > 0
    if (distribuciones.length > 0) {
      this.pedidoService.onSavePedidoItemDistribuciones(this.data.item.id, distribuciones as any).subscribe({
        next: (savedDistribuciones) => {
          console.log('Distribuciones guardadas:', savedDistribuciones);
          checkCompletion();
        },
        error: (error) => {
          console.error("Error guardando distribuciones:", error);
          this.notificacionService.openAlgoSalioMal("Error al guardar las distribuciones");
          hasErrors = true;
          checkCompletion();
        }
      });
    }

    // Eliminar distribuciones con cantidad = 0
    if (distribucionesToDelete.length > 0) {
      this.pedidoService.onDeletePedidoItemDistribuciones(distribucionesToDelete).subscribe({
        next: (deleted) => {
          console.log('Distribuciones eliminadas:', deleted);
          checkCompletion();
        },
        error: (error) => {
          console.error("Error eliminando distribuciones:", error);
          this.notificacionService.openAlgoSalioMal("Error al eliminar las distribuciones");
          hasErrors = true;
          checkCompletion();
        }
      });
    }
  }

  onDeleteDistribuciones(): void {
    if (!this.canDeleteComputed) {
      return;
    }

    if (this.savingComputed) {
      return;
    }

    this.savingComputed = true;

    this.pedidoService.onDeletePedidoItemDistribuciones(this.distribucionesSeleccionadas).subscribe({
      next: (deleted) => {
        console.log('Distribuciones eliminadas:', deleted);
        this.savingComputed = false;
        this.notificacionService.openSucess("Distribuciones eliminadas exitosamente");
        this.dialogRef.close({ success: true, action: 'delete' });
      },
      error: (error) => {
        console.error("Error eliminando distribuciones:", error);
        this.savingComputed = false;
        this.notificacionService.openAlgoSalioMal("Error al eliminar las distribuciones");
        this.dialogRef.close({ success: false, action: 'delete' });
      }
    });
  }

  onCancel(): void {
    const result: DistributeItemDialogResult = {
      success: false,
      action: 'cancel'
    };
    this.dialogRef.close(result);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.distribucionForm.controls).forEach(key => {
      const control = this.distribucionForm.get(key);
      control?.markAsTouched();
    });
  }

  // Utility methods - removed formatNumber, getDiscrepanciaClass, getDiscrepanciaIcon
  // to comply with "no functions in templates" rule
} 