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
  
  // Modo de visualización
  modoVisualizacion: 'trazabilidad' | 'simplificado' = 'trazabilidad'; // 'trazabilidad' = por sucursalInfluencia, 'simplificado' = por sucursalEntrega
  
  // Modo de borrado
  modoBorrado = false;
  distribucionesSeleccionadas: number[] = [];
  
  // Computed properties for template
  titleComputed = '';
  dialogTitleComputed = '';
  dialogSubtitleComputed = '';
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

  // Computed properties for distribution items
  distribucionesComputed: Array<{
    sucursalInfluenciaId: number;
    sucursalInfluenciaNombre: string;
    sucursalEntregaId: number;
    sucursalEntregaNombre: string;
    cantidadAsignada: number;
    direccionEntrega: string;
    distribucionId: number | null;
    modoVisualizacion: string;
    distribucionesIds: number[];
  }> = [];

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

    if (this.modoVisualizacion === 'trazabilidad') {
      // MODO TRAZABILIDAD: Mostrar por sucursal de influencia
      this.loadDistribucionesPorTrazabilidad(distribucionesArray);
    } else {
      // MODO SIMPLIFICADO: Agrupar por sucursal de entrega
      this.loadDistribucionesSimplificadas(distribucionesArray);
    }
    
    // Calcular propiedades computadas para el template
    this.calculateDistribucionesComputed();
  }

  private loadDistribucionesPorTrazabilidad(distribucionesArray: FormArray): void {
    // TRAZABILIDAD COMPLETA: Mostrar todas las combinaciones posibles
    // Sucursal de Influencia × Sucursal de Entrega
    // Esto permite crear múltiples distribuciones para la misma sucursal de influencia
    // pero con diferentes sucursales de entrega
    
    // Primero, crear un mapa de distribuciones existentes por combinación
    const distribucionesExistentes = new Map<string, PedidoItemDistribucion>();
    this.data.distribuciones.forEach(dist => {
      const key = `${dist.sucursalInfluencia.id}_${dist.sucursalEntrega.id}`;
      distribucionesExistentes.set(key, dist);
    });

    // Crear una fila para cada combinación posible
    this.data.sucursalesInfluencia.forEach(sucursalInfluencia => {
      this.data.sucursalesEntrega.forEach(sucursalEntrega => {
        // Buscar distribución existente para esta combinación
        const key = `${sucursalInfluencia.id}_${sucursalEntrega.id}`;
        const existingDistribucion = distribucionesExistentes.get(key);
        
        // Cantidad asignada en unidades base
        const cantidadAsignadaUnidadBase = existingDistribucion ? existingDistribucion.cantidadAsignada : 0;
        
        // Convertir a presentación si es necesario
        const cantidadAsignada = this.distribuyePorPresentacion 
          ? cantidadAsignadaUnidadBase / this.cantidadPorPresentacionComputed
          : cantidadAsignadaUnidadBase;

        const distribucionGroup = this.formBuilder.group({
          sucursalInfluencia: [sucursalInfluencia.id, [Validators.required]],
          sucursalInfluenciaNombre: [sucursalInfluencia.nombre],
          sucursalEntrega: [sucursalEntrega.id, [Validators.required]],
          sucursalEntregaNombre: [sucursalEntrega.nombre],
          cantidadAsignada: [cantidadAsignada, [Validators.min(0)]],
          direccionEntrega: [sucursalEntrega.direccion || ''],
          seleccionado: [false], // Para el modo borrado
          distribucionId: [existingDistribucion?.id || null], // ID de la distribución existente
          modoVisualizacion: ['trazabilidad'] // Para identificar el modo
        });

        distribucionesArray.push(distribucionGroup);
      });
    });
  }

  private loadDistribucionesSimplificadas(distribucionesArray: FormArray): void {
    // Agrupar distribuciones existentes por sucursal de entrega
    const distribucionesPorEntrega = new Map<number, {
      sucursalEntrega: Sucursal;
      cantidadTotal: number;
      distribucionesIds: number[];
      sucursalesInfluencia: Sucursal[];
    }>();

    // Procesar distribuciones existentes
    this.data.distribuciones.forEach(dist => {
      const sucursalEntregaId = dist.sucursalEntrega?.id;
      if (sucursalEntregaId) {
        if (!distribucionesPorEntrega.has(sucursalEntregaId)) {
          distribucionesPorEntrega.set(sucursalEntregaId, {
            sucursalEntrega: dist.sucursalEntrega!,
            cantidadTotal: 0,
            distribucionesIds: [],
            sucursalesInfluencia: []
          });
        }
        
        const grupo = distribucionesPorEntrega.get(sucursalEntregaId)!;
        grupo.cantidadTotal += dist.cantidadAsignada || 0;
        grupo.distribucionesIds.push(dist.id!);
        
        // Agregar sucursal de influencia si no existe
        if (dist.sucursalInfluencia && !grupo.sucursalesInfluencia.find(si => si.id === dist.sucursalInfluencia?.id)) {
          grupo.sucursalesInfluencia.push(dist.sucursalInfluencia);
        }
      }
    });

    // Crear controles para cada sucursal de entrega que tiene distribuciones existentes
    distribucionesPorEntrega.forEach((grupo, sucursalEntregaId) => {
      // Convertir cantidad total de unidades base a presentación si es necesario
      const cantidadAsignada = this.distribuyePorPresentacion
        ? grupo.cantidadTotal / this.cantidadPorPresentacionComputed
        : grupo.cantidadTotal;

      const distribucionGroup = this.formBuilder.group({
        sucursalInfluencia: [null], // No aplica en modo simplificado
        sucursalInfluenciaNombre: [grupo.sucursalesInfluencia.map(si => si.nombre).join(', ')],
        sucursalEntrega: [sucursalEntregaId, [Validators.required]],
        sucursalEntregaNombre: [grupo.sucursalEntrega.nombre],
        cantidadAsignada: [cantidadAsignada, [Validators.min(0)]],
        direccionEntrega: [grupo.sucursalEntrega.direccion || ''],
        seleccionado: [false], // Para el modo borrado
        distribucionId: [grupo.distribucionesIds[0] || null], // ID de la primera distribución del grupo
        modoVisualizacion: ['simplificado'], // Para identificar el modo
        distribucionesIds: [grupo.distribucionesIds] // IDs de todas las distribuciones del grupo
      });

      distribucionesArray.push(distribucionGroup);
    });

    // Agregar controles para las sucursales de entrega que NO tienen distribuciones
    // Esto permite crear nuevas distribuciones para sucursales que aún no tienen asignaciones
    const sucursalesConDistribuciones = new Set(distribucionesPorEntrega.keys());
    this.data.sucursalesEntrega.forEach((sucursalEntrega) => {
      // Solo agregar si esta sucursal no tiene distribuciones
      if (!sucursalesConDistribuciones.has(sucursalEntrega.id)) {
        const distribucionGroup = this.formBuilder.group({
          sucursalInfluencia: [null],
          sucursalInfluenciaNombre: ['Todas las sucursales'],
          sucursalEntrega: [sucursalEntrega.id, [Validators.required]],
          sucursalEntregaNombre: [sucursalEntrega.nombre],
          cantidadAsignada: [0, [Validators.min(0)]],
          direccionEntrega: [sucursalEntrega.direccion || ''],
          seleccionado: [false],
          distribucionId: [null],
          modoVisualizacion: ['simplificado'],
          distribucionesIds: [[]]
        });

        distribucionesArray.push(distribucionGroup);
      }
    });
  }

  private setupFormSubscriptions(): void {
    this.distribucionForm.valueChanges.subscribe(() => {
      this.updateComputedProperties();
      this.calculateDistribucionesComputed();
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
    
    // Title
    this.titleComputed = this.data.title || 'Distribuir Ítem';
    this.dialogTitleComputed = this.modoVisualizacion === 'trazabilidad' 
      ? 'Distribución por Sucursal de Influencia' 
      : 'Distribución por Sucursal de Entrega';
    this.dialogSubtitleComputed = this.modoVisualizacion === 'trazabilidad'
      ? 'Para cada sucursal que necesita el producto, seleccione dónde se entregará y qué cantidad'
      : 'Para cada sucursal de entrega, asigne la cantidad total que se entregará allí';
    
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

  onToggleVisualizacionMode(): void {
    this.modoVisualizacion = this.modoVisualizacion === 'trazabilidad' ? 'simplificado' : 'trazabilidad';
    this.calculatePresentationProperties();
    this.loadDistribuciones();
    this.updateComputedProperties();
  }

  private calculateDistribucionesComputed(): void {
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    this.distribucionesComputed = [];
    
    distribucionesArray.controls.forEach((control) => {
      const formValue = control.value;
      this.distribucionesComputed.push({
        sucursalInfluenciaId: formValue.sucursalInfluencia,
        sucursalInfluenciaNombre: formValue.sucursalInfluenciaNombre,
        sucursalEntregaId: formValue.sucursalEntrega,
        sucursalEntregaNombre: formValue.sucursalEntregaNombre,
        cantidadAsignada: formValue.cantidadAsignada,
        direccionEntrega: formValue.direccionEntrega,
        distribucionId: formValue.distribucionId,
        modoVisualizacion: formValue.modoVisualizacion,
        distribucionesIds: formValue.distribucionesIds || []
      });
    });
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
    if (!this.modoBorrado) return;
    
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    const control = distribucionesArray.at(index);
    const seleccionado = control.get('seleccionado')?.value;
    
    control.get('seleccionado')?.setValue(!seleccionado);
    
    // Update selected array (using indices, not IDs)
    this.distribucionesSeleccionadas = [];
    distribucionesArray.controls.forEach((ctrl, idx) => {
      if (ctrl.get('seleccionado')?.value) {
        this.distribucionesSeleccionadas.push(idx);
      }
    });
    
    this.updateComputedProperties();
  }

  // Distribution actions
  onDistribuirUniforme(): void {
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    const cantidadBase = this.distribuyePorPresentacion 
      ? this.cantidadSolicitadaPorPresentacionComputed 
      : this.cantidadSolicitadaComputed;
    const cantidadPorSucursal = cantidadBase / distribucionesArray.length;
    
    distribucionesArray.controls.forEach(control => {
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
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    const cantidadBase = this.distribuyePorPresentacion 
      ? this.cantidadSolicitadaPorPresentacionComputed 
      : this.cantidadSolicitadaComputed;
    
    if (distribucionesArray.length > 0) {
      // Asignar todo a la primera sucursal
      const primeraSucursal = distribucionesArray.at(0);
      primeraSucursal.get('cantidadAsignada')?.setValue(cantidadBase);
      
      // Limpiar las demás
      for (let i = 1; i < distribucionesArray.length; i++) {
        distribucionesArray.at(i).get('cantidadAsignada')?.setValue(0);
      }
    }
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
      this.savingComputed = false; // Resetear flag para permitir reintentos
      return;

      // if (confirm(message)) {
      //   // User confirmed to update the original quantity
      //   // This would be handled by the parent component
      // }
    }

    const formValue = this.distribucionForm.value;
    const distribuciones: PedidoItemDistribucionInput[] = [];

    formValue.distribuciones.forEach((d: any) => {
      const distribucionId = d.distribucionId;
      const cantidadAsignada = parseFloat(d.cantidadAsignada) || 0;
      const modoVisualizacion = d.modoVisualizacion;
      
      if (cantidadAsignada > 0) {
        if (modoVisualizacion === 'trazabilidad') {
          // MODO TRAZABILIDAD: Crear distribución individual
          const sucursalInfluencia = this.data.sucursalesInfluencia.find(si => si.id === d.sucursalInfluencia);
          const sucursalEntrega = this.data.sucursalesEntrega.find(se => se.id === d.sucursalEntrega);
          
          // Convertir la cantidad a unidades base (siempre guardamos en unidades base)
          const cantidadEnUnidadBase = this.distribuyePorPresentacion
            ? cantidadAsignada * this.cantidadPorPresentacionComputed
            : cantidadAsignada;
          
          let distribucion = new PedidoItemDistribucion();
          // Incluir ID si existe para que el merge pueda actualizar en lugar de crear
          distribucion.id = distribucionId || undefined;
          distribucion.pedidoItem = this.data.item;
          distribucion.sucursalInfluencia = sucursalInfluencia!;
          distribucion.sucursalEntrega = sucursalEntrega!;
          distribucion.cantidadAsignada = cantidadEnUnidadBase;
          distribuciones.push(distribucion.toInput());
        } else {
          // MODO SIMPLIFICADO: Crear distribuciones para todas las sucursales de influencia
          const sucursalEntrega = this.data.sucursalesEntrega.find(se => se.id === d.sucursalEntrega);
          
          // Convertir la cantidad total a unidades base (siempre guardamos en unidades base)
          const cantidadTotalEnUnidadBase = this.distribuyePorPresentacion
            ? cantidadAsignada * this.cantidadPorPresentacionComputed
            : cantidadAsignada;
          
          // Distribuir proporcionalmente entre las sucursales de influencia
          const sucursalesInfluencia = this.data.sucursalesInfluencia;
          const cantidadPorSucursal = cantidadTotalEnUnidadBase / sucursalesInfluencia.length;
          
          sucursalesInfluencia.forEach((sucursalInfluencia, index) => {
            let distribucion = new PedidoItemDistribucion();
            // En modo simplificado, intentar mantener IDs si existen
            // El backend merge identificará por combinación sucursal_influencia + sucursal_entrega
            const distribucionesIds = d.distribucionesIds || [];
            distribucion.id = distribucionesIds[index] || undefined;
            distribucion.pedidoItem = this.data.item;
            distribucion.sucursalInfluencia = sucursalInfluencia;
            distribucion.sucursalEntrega = sucursalEntrega!;
            distribucion.cantidadAsignada = cantidadPorSucursal;
            distribuciones.push(distribucion.toInput());
          });
        }
      }
    });

    // Usar merge para actualizar existentes, crear nuevas y eliminar las que ya no están
    // Esto mantiene los IDs de las distribuciones existentes cuando es posible
    this.executeMergeOperations(distribuciones);
  }

  private executeMergeOperations(distribuciones: PedidoItemDistribucionInput[]): void {
    this.pedidoService.onMergePedidoItemDistribuciones(this.data.item.id, distribuciones).subscribe({
      next: (result) => {
        console.log('Distribuciones guardadas:', result);
        this.savingComputed = false;
        this.notificacionService.openSucess('Distribución guardada correctamente');
        this.dialogRef.close({
          success: true,
          action: 'save',
          message: 'Distribución actualizada correctamente'
        });
      },
      error: (error) => {
        console.error('Error al guardar distribuciones:', error);
        this.savingComputed = false;
        this.notificacionService.openAlgoSalioMal('Error al guardar las distribuciones');
        this.dialogRef.close({ success: false, action: 'save' });
      }
    });
  }

  onDeleteDistribuciones(): void {
    if (this.distribucionesSeleccionadas.length === 0) {
      this.notificacionService.openAlgoSalioMal('Seleccione al menos una distribución para eliminar');
      return;
    }

    if (this.savingComputed) {
      return;
    }

    this.savingComputed = true;

    // Get IDs of selected distributions
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    const idsToDelete: number[] = [];
    
    this.distribucionesSeleccionadas.forEach(index => {
      const control = distribucionesArray.at(index);
      const distribucionId = control.get('distribucionId')?.value;
      if (distribucionId) {
        idsToDelete.push(distribucionId);
      }
    });

    // Replace with remaining distributions (exclude selected ones)
    const remainingDistribuciones: PedidoItemDistribucionInput[] = [];
    
    distribucionesArray.controls.forEach((control, index) => {
      if (!this.distribucionesSeleccionadas.includes(index)) {
        const cantidadAsignada = parseFloat(control.get('cantidadAsignada')?.value) || 0;
        if (cantidadAsignada > 0) {
          const modoVisualizacion = control.get('modoVisualizacion')?.value;
          const sucursalInfluenciaId = control.get('sucursalInfluencia')?.value;
          const sucursalEntregaId = control.get('sucursalEntrega')?.value;
          
          if (modoVisualizacion === 'trazabilidad') {
            const sucursalInfluencia = this.data.sucursalesInfluencia.find(si => si.id === sucursalInfluenciaId);
            const sucursalEntrega = this.data.sucursalesEntrega.find(se => se.id === sucursalEntregaId);
            
            const cantidadEnUnidadBase = this.distribuyePorPresentacion
              ? cantidadAsignada * this.cantidadPorPresentacionComputed
              : cantidadAsignada;
            
            let distribucion = new PedidoItemDistribucion();
            // Incluir ID si existe para que el merge pueda actualizar en lugar de crear
            distribucion.id = control.get('distribucionId')?.value || undefined;
            distribucion.pedidoItem = this.data.item;
            distribucion.sucursalInfluencia = sucursalInfluencia!;
            distribucion.sucursalEntrega = sucursalEntrega!;
            distribucion.cantidadAsignada = cantidadEnUnidadBase;
            remainingDistribuciones.push(distribucion.toInput());
          }
        }
      }
    });

    this.pedidoService.onMergePedidoItemDistribuciones(this.data.item.id, remainingDistribuciones).subscribe({
      next: (result) => {
        this.savingComputed = false;
        this.notificacionService.openSucess('Distribuciones eliminadas correctamente');
        this.dialogRef.close({
          success: true,
          action: 'delete',
          message: 'Distribuciones eliminadas correctamente'
        });
      },
      error: (error) => {
        console.error('Error al eliminar distribuciones:', error);
        this.savingComputed = false;
        this.notificacionService.openAlgoSalioMal('Error al eliminar las distribuciones');
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