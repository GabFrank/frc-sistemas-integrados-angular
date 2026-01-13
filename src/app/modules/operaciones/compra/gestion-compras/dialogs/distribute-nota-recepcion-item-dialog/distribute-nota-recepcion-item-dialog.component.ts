import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Producto } from '../../../../../productos/producto/producto.model';
import { NotaRecepcionItem } from '../../nota-recepcion-item.model';
import { NotaRecepcionItemDistribucion, NotaRecepcionItemDistribucionInput } from '../../models/nota-recepcion-item-distribucion.model';
import { Sucursal } from '../../../../../empresarial/sucursal/sucursal.model';
import { PedidoService } from '../../../pedido.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';

export interface DistributeNotaRecepcionItemDialogData {
  item: NotaRecepcionItem;
  distribuciones: NotaRecepcionItemDistribucion[];
  sucursalesInfluencia: Sucursal[];
  sucursalesEntrega: Sucursal[];
  title: string;
}

export interface DistributeNotaRecepcionItemDialogResult {
  success: boolean;
  action: 'save' | 'delete' | 'cancel';
  message?: string;
}

@Component({
  selector: 'app-distribute-nota-recepcion-item-dialog',
  templateUrl: './distribute-nota-recepcion-item-dialog.component.html',
  styleUrls: ['./distribute-nota-recepcion-item-dialog.component.scss']
})
export class DistributeNotaRecepcionItemDialogComponent implements OnInit {
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
  totalAsignadoComputed = 0;
  cantidadEnNotaComputed = 0;
  discrepanciaComputed = 0;
  hasDiscrepanciaComputed = false;
  discrepanciaTipoComputed: 'mayor' | 'menor' | 'igual' = 'igual';
  absDiscrepanciaComputed = 0;
  
  // Totales para mostrar según el modo seleccionado
  totalAsignadoMostrarComputed = 0;
  cantidadEnNotaMostrarComputed = 0;
  discrepanciaMostrarComputed = 0;
  absDiscrepanciaMostrarComputed = 0;
  
  // Presentación info
  presentacionEnNotaComputed = '';
  cantidadPorPresentacionComputed = 1;
  cantidadEnNotaPorPresentacionComputed = 0;
  
  // Formatted values for template (avoid function calls)
  totalAsignadoFormattedComputed = '';
  discrepanciaFormattedComputed = '';
  absDiscrepanciaFormattedComputed = '';
  cantidadEnNotaFormattedComputed = '';
  
  // Unidades para mostrar en el template
  unidadMostrarComputed = '';
  
  // Status classes and icons (avoid function calls)
  discrepanciaClassComputed = '';
  discrepanciaIconComputed = '';

  // Loading state
  savingComputed = false;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<DistributeNotaRecepcionItemDialogComponent>,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionSnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: DistributeNotaRecepcionItemDialogData
  ) {
    this.initializeForm();
  }

    ngOnInit(): void {
    console.log('DistributeNotaRecepcionItemDialog - ngOnInit');
    console.log('Data recibida:', this.data);
    console.log('Distribuciones existentes:', this.data.distribuciones);
    console.log('Sucursales de influencia:', this.data.sucursalesInfluencia);
    console.log('Sucursales de entrega:', this.data.sucursalesEntrega);
    
    // Verificar estructura de distribuciones
    if (this.data.distribuciones && this.data.distribuciones.length > 0) {
      console.log('Primera distribución:', this.data.distribuciones[0]);
      console.log('¿Tiene sucursalInfluencia?', !!this.data.distribuciones[0].sucursalInfluencia);
      console.log('¿Tiene sucursalEntrega?', !!this.data.distribuciones[0].sucursalEntrega);
      console.log('¿Tiene cantidad?', this.data.distribuciones[0].cantidad);
    }
    
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

  /**
   * Calcula las propiedades de presentación y convierte cantidades
   * IMPORTANTE: cantidadEnNota está almacenada en unidades base
   */
  private calculatePresentationProperties(): void {
    const item = this.data.item;
    
    // Obtener información de presentación
    if (item.presentacionEnNota) {
      this.presentacionEnNotaComputed = item.presentacionEnNota.descripcion;
      this.cantidadPorPresentacionComputed = item.presentacionEnNota.cantidad || 1;
    } else {
      this.presentacionEnNotaComputed = 'Unidad';
      this.cantidadPorPresentacionComputed = 1;
    }
    
    // cantidadEnNota está en unidades base
    this.cantidadEnNotaComputed = item.cantidadEnNota || 0;
    
    // Convertir a presentación: unidades base / cantidad por presentación
    this.cantidadEnNotaPorPresentacionComputed = this.cantidadPorPresentacionComputed > 0
      ? this.cantidadEnNotaComputed / this.cantidadPorPresentacionComputed
      : this.cantidadEnNotaComputed;
    
    // Unidad para mostrar según el modo
    this.unidadMostrarComputed = this.distribuyePorPresentacion ? this.presentacionEnNotaComputed : 'unidades';
  }

  /**
   * Convierte cantidad de presentación a unidades base
   */
  private convertirPresentacionAUnidadBase(cantidadPresentacion: number): number {
    return this.distribuyePorPresentacion
      ? cantidadPresentacion * this.cantidadPorPresentacionComputed
      : cantidadPresentacion;
  }

  /**
   * Convierte cantidad de unidades base a presentación
   */
  private convertirUnidadBaseAPresentacion(cantidadUnidadBase: number): number {
    return this.cantidadPorPresentacionComputed > 0
      ? cantidadUnidadBase / this.cantidadPorPresentacionComputed
      : cantidadUnidadBase;
  }

  private loadDistribuciones(): void {
    console.log('loadDistribuciones - Iniciando');
    console.log('Modo de visualización:', this.modoVisualizacion);
    console.log('Sucursales de influencia disponibles:', this.data.sucursalesInfluencia);
    console.log('Sucursales de entrega disponibles:', this.data.sucursalesEntrega);
    console.log('Distribuciones existentes:', this.data.distribuciones);
    
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
    
    console.log('FormArray final:', distribucionesArray.value);
  }

  private loadDistribucionesPorTrazabilidad(distribucionesArray: FormArray): void {
    console.log('Cargando distribuciones en modo TRAZABILIDAD');
    console.log('Distribuciones existentes:', this.data.distribuciones);
    
    // Verificar si hay distribuciones sin sucursalInfluencia
    const distribucionesSinSucursalInfluencia = this.data.distribuciones.filter(d => !d.sucursalInfluencia);
    const distribucionesConSucursalInfluencia = this.data.distribuciones.filter(d => d.sucursalInfluencia);
    
    console.log('Distribuciones sin sucursalInfluencia:', distribucionesSinSucursalInfluencia);
    console.log('Distribuciones con sucursalInfluencia:', distribucionesConSucursalInfluencia);
    
    // Si hay distribuciones con sucursalInfluencia, mostrarlas individualmente
    if (distribucionesConSucursalInfluencia.length > 0) {
      console.log('Mostrando distribuciones con sucursalInfluencia individualmente');
      
      distribucionesConSucursalInfluencia.forEach((distribucion, index) => {
        console.log(`Procesando distribución ${index}:`, distribucion);
        
        // Convertir cantidad de unidades base a presentación si es necesario
        const cantidadAsignada = this.convertirUnidadBaseAPresentacion(distribucion.cantidad || 0);

        const distribucionGroup = this.formBuilder.group({
          sucursalInfluencia: [distribucion.sucursalInfluencia.id, [Validators.required]],
          sucursalInfluenciaNombre: [distribucion.sucursalInfluencia.nombre],
          sucursalEntrega: [distribucion.sucursalEntrega?.id || null, [Validators.required]],
          sucursalEntregaNombre: [distribucion.sucursalEntrega?.nombre || ''],
          cantidadAsignada: [cantidadAsignada, [Validators.min(0)]],
          direccionEntrega: [distribucion.sucursalEntrega?.direccion || ''],
          seleccionado: [false], // Para el modo borrado
          distribucionId: [distribucion.id], // ID de la distribución existente
          modoVisualizacion: ['trazabilidad'] // Para identificar el modo
        });

        distribucionesArray.push(distribucionGroup);
      });
    }
    // Si solo hay distribuciones sin sucursalInfluencia, mostrarlas como distribuciones individuales
    // asignando cada una a una sucursal de influencia diferente
    else if (distribucionesSinSucursalInfluencia.length > 0) {
      console.log('Mostrando distribuciones sin sucursalInfluencia como distribuciones individuales');
      
      distribucionesSinSucursalInfluencia.forEach((distribucion, index) => {
        console.log(`Procesando distribución sin sucursalInfluencia ${index}:`, distribucion);
        
        // Asignar a una sucursal de influencia (por índice)
        const sucursalInfluenciaIndex = index % this.data.sucursalesInfluencia.length;
        const sucursalInfluencia = this.data.sucursalesInfluencia[sucursalInfluenciaIndex];
        
        // Convertir cantidad de unidades base a presentación si es necesario
        const cantidadAsignada = this.convertirUnidadBaseAPresentacion(distribucion.cantidad || 0);

        const distribucionGroup = this.formBuilder.group({
          sucursalInfluencia: [sucursalInfluencia.id, [Validators.required]],
          sucursalInfluenciaNombre: [sucursalInfluencia.nombre],
          sucursalEntrega: [distribucion.sucursalEntrega?.id || null, [Validators.required]],
          sucursalEntregaNombre: [distribucion.sucursalEntrega?.nombre || ''],
          cantidadAsignada: [cantidadAsignada, [Validators.min(0)]],
          direccionEntrega: [distribucion.sucursalEntrega?.direccion || ''],
          seleccionado: [false], // Para el modo borrado
          distribucionId: [distribucion.id], // ID de la distribución existente
          modoVisualizacion: ['trazabilidad'] // Para identificar el modo
        });

        distribucionesArray.push(distribucionGroup);
      });
    }
    // Si no hay distribuciones existentes, crear controles vacíos para cada sucursal de influencia
    else {
      console.log('No hay distribuciones existentes, creando controles vacíos para cada sucursal de influencia');
      
      this.data.sucursalesInfluencia.forEach((sucursalInfluencia, index) => {
        const distribucionGroup = this.formBuilder.group({
          sucursalInfluencia: [sucursalInfluencia.id, [Validators.required]],
          sucursalInfluenciaNombre: [sucursalInfluencia.nombre],
          sucursalEntrega: [this.data.sucursalesEntrega[0]?.id || null, [Validators.required]],
          sucursalEntregaNombre: [this.data.sucursalesEntrega[0]?.nombre || ''],
          cantidadAsignada: [0, [Validators.min(0)]],
          direccionEntrega: [this.data.sucursalesEntrega[0]?.direccion || ''],
          seleccionado: [false],
          distribucionId: [null],
          modoVisualizacion: ['trazabilidad']
        });

        distribucionesArray.push(distribucionGroup);
      });
    }
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
        grupo.cantidadTotal += dist.cantidad || 0;
        grupo.distribucionesIds.push(dist.id);
        
        // Agregar sucursal de influencia si no existe
        if (dist.sucursalInfluencia && !grupo.sucursalesInfluencia.find(si => si.id === dist.sucursalInfluencia?.id)) {
          grupo.sucursalesInfluencia.push(dist.sucursalInfluencia);
        }
      }
    });

    // Crear controles para cada sucursal de entrega
    distribucionesPorEntrega.forEach((grupo, sucursalEntregaId) => {
      // Convertir cantidad total de unidades base a presentación si es necesario
      const cantidadAsignada = this.convertirUnidadBaseAPresentacion(grupo.cantidadTotal);

      console.log('grupo.sucursalesInfluencia', grupo.sucursalesInfluencia);

      const distribucionGroup = this.formBuilder.group({
        sucursalInfluencia: [null], // No aplica en modo simplificado
        sucursalInfluenciaNombre: [grupo.sucursalesInfluencia.map(si => si.nombre).join(', ')],
        sucursalEntrega: [sucursalEntregaId, [Validators.required]],
        sucursalEntregaNombre: [grupo.sucursalEntrega.nombre],
        cantidadAsignada: [cantidadAsignada, [Validators.min(0)]],
        direccionEntrega: [grupo.sucursalEntrega.direccion || ''],
        seleccionado: [false], // Para el modo borrado
        distribucionId: [grupo.distribucionesIds[0]], // ID de la primera distribución del grupo
        modoVisualizacion: ['simplificado'], // Para identificar el modo
        distribucionesIds: [grupo.distribucionesIds] // IDs de todas las distribuciones del grupo
      });

      console.log('suc influencia form', distribucionGroup.get('sucursalInfluencia')?.value);

      distribucionesArray.push(distribucionGroup);
    });

    // Si no hay distribuciones existentes, crear controles para todas las sucursales de entrega disponibles
    if (distribucionesPorEntrega.size === 0) {
      this.data.sucursalesEntrega.forEach((sucursalEntrega, index) => {
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
      });
    }
  }

  private setupFormSubscriptions(): void {
    this.distribucionForm.valueChanges.subscribe(() => {
      this.updateComputedProperties();
      this.calculateDistribucionesComputed();
    });
  }

  /**
   * Actualiza todas las propiedades computadas para el template
   * Todos los cálculos internos se hacen en unidades base para consistencia
   */
  private updateComputedProperties(): void {
    const formValue = this.distribucionForm.value;
    
    // Calcular total asignado en el modo actual (presentación o unidades)
    this.totalAsignadoComputed = 0;
    if (formValue.distribuciones) {
      formValue.distribuciones.forEach((d: any) => {
        const cantidad = parseFloat(d.cantidadAsignada) || 0;
        this.totalAsignadoComputed += cantidad;
      });
    }
    
    // Convertir total asignado a unidades base para cálculos internos
    const totalAsignadoUnidadBase = this.convertirPresentacionAUnidadBase(this.totalAsignadoComputed);
    
    // Calcular discrepancia en unidades base (siempre trabajamos en unidades base internamente)
    this.discrepanciaComputed = totalAsignadoUnidadBase - this.cantidadEnNotaComputed;
    this.absDiscrepanciaComputed = Math.abs(this.discrepanciaComputed);
    this.hasDiscrepanciaComputed = Math.abs(this.discrepanciaComputed) > 0.001; // Tolerancia para decimales
    
    // Determinar tipo de discrepancia
    if (this.discrepanciaComputed > 0.001) {
      this.discrepanciaTipoComputed = 'mayor';
    } else if (this.discrepanciaComputed < -0.001) {
      this.discrepanciaTipoComputed = 'menor';
    } else {
      this.discrepanciaTipoComputed = 'igual';
    }
    
    // Valores para mostrar según el modo de distribución
    if (this.distribuyePorPresentacion) {
      // Modo presentación: convertir todo a presentación para mostrar
      this.totalAsignadoMostrarComputed = this.totalAsignadoComputed;
      this.cantidadEnNotaMostrarComputed = this.cantidadEnNotaPorPresentacionComputed;
      this.discrepanciaMostrarComputed = this.convertirUnidadBaseAPresentacion(this.discrepanciaComputed);
      this.absDiscrepanciaMostrarComputed = this.convertirUnidadBaseAPresentacion(this.absDiscrepanciaComputed);
    } else {
      // Modo unidades: mostrar todo en unidades base
      this.totalAsignadoMostrarComputed = totalAsignadoUnidadBase;
      this.cantidadEnNotaMostrarComputed = this.cantidadEnNotaComputed;
      this.discrepanciaMostrarComputed = this.discrepanciaComputed;
      this.absDiscrepanciaMostrarComputed = this.absDiscrepanciaComputed;
    }
    
    // Formatted values
    this.totalAsignadoFormattedComputed = this.totalAsignadoMostrarComputed.toFixed(2);
    this.cantidadEnNotaFormattedComputed = this.cantidadEnNotaMostrarComputed.toFixed(2);
    this.discrepanciaFormattedComputed = this.discrepanciaMostrarComputed.toFixed(2);
    this.absDiscrepanciaFormattedComputed = this.absDiscrepanciaMostrarComputed.toFixed(2);
    
    // Status classes and icons
    if (this.hasDiscrepanciaComputed) {
      this.discrepanciaClassComputed = this.discrepanciaTipoComputed === 'mayor' ? 'discrepancia-mayor' : 'discrepancia-menor';
      this.discrepanciaIconComputed = this.discrepanciaTipoComputed === 'mayor' ? 'warning' : 'error';
    } else {
      this.discrepanciaClassComputed = 'discrepancia-igual';
      this.discrepanciaIconComputed = 'check_circle';
    }
    
    // Can save/delete
    this.canSaveComputed = this.allQuantitiesValid() && !this.savingComputed;
    this.canDeleteComputed = this.distribucionesSeleccionadas.length > 0;
    
    // Title
    this.titleComputed = this.data.title || 'Distribuir Ítem';
    this.dialogTitleComputed = this.modoVisualizacion === 'trazabilidad' 
      ? 'Distribución por Sucursal de Influencia' 
      : 'Distribución por Sucursal de Entrega';
    this.dialogSubtitleComputed = this.modoVisualizacion === 'trazabilidad'
      ? 'Para cada sucursal que necesita el producto, seleccione dónde se entregará y qué cantidad'
      : 'Para cada sucursal de entrega, asigne la cantidad total que se entregará allí';
  }

  private allQuantitiesValid(): boolean {
    const formValue = this.distribucionForm.value;
    if (!formValue.distribuciones) return true;
    
    return formValue.distribuciones.every((d: any) => {
      const cantidad = parseFloat(d.cantidadAsignada) || 0;
      return cantidad >= 0;
    });
  }

  get distribucionesArray(): FormArray {
    return this.distribucionForm.get('distribuciones') as FormArray;
  }

  onToggleDistribucionMode(): void {
    this.distribuyePorPresentacion = !this.distribuyePorPresentacion;
    this.calculatePresentationProperties();
    this.loadDistribuciones();
    this.updateComputedProperties();
  }

  onToggleVisualizacionMode(): void {
    console.log('Cambiando modo de visualización de', this.modoVisualizacion, 'a', this.modoVisualizacion === 'trazabilidad' ? 'simplificado' : 'trazabilidad');
    this.modoVisualizacion = this.modoVisualizacion === 'trazabilidad' ? 'simplificado' : 'trazabilidad';
    this.calculatePresentationProperties();
    this.loadDistribuciones();
    this.updateComputedProperties();
  }

  private calculateDistribucionesComputed(): void {
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    this.distribucionesComputed = [];
    
    distribucionesArray.controls.forEach((control, index) => {
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
    
    console.log('Distribuciones computadas:', this.distribucionesComputed);
  }

  onToggleBorradoMode(): void {
    this.modoBorrado = !this.modoBorrado;
    this.distribucionesSeleccionadas = [];
    
    // Reset all selections
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    distribucionesArray.controls.forEach(control => {
      control.get('seleccionado')?.setValue(false);
    });
  }

  onToggleSeleccion(index: number): void {
    if (!this.modoBorrado) return;
    
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    const control = distribucionesArray.at(index);
    const seleccionado = control.get('seleccionado')?.value;
    
    control.get('seleccionado')?.setValue(!seleccionado);
    
    // Update selected array
    this.distribucionesSeleccionadas = [];
    distribucionesArray.controls.forEach((ctrl, idx) => {
      if (ctrl.get('seleccionado')?.value) {
        this.distribucionesSeleccionadas.push(idx);
      }
    });
  }

  onDistribuirUniforme(): void {
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    const cantidadPorSucursal = this.cantidadEnNotaPorPresentacionComputed / this.data.sucursalesInfluencia.length;
    
    distribucionesArray.controls.forEach(control => {
      control.get('cantidadAsignada')?.setValue(cantidadPorSucursal);
    });
  }

  onLimpiarDistribuciones(): void {
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    
    distribucionesArray.controls.forEach(control => {
      control.get('cantidadAsignada')?.setValue(0);
    });
  }

  onAsignarTotal(): void {
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    
    if (distribucionesArray.length > 0) {
      // Asignar todo a la primera sucursal
      const primeraSucursal = distribucionesArray.at(0);
      primeraSucursal.get('cantidadAsignada')?.setValue(this.cantidadEnNotaPorPresentacionComputed);
      
      // Limpiar las demás
      for (let i = 1; i < distribucionesArray.length; i++) {
        distribucionesArray.at(i).get('cantidadAsignada')?.setValue(0);
      }
    }
  }

  onCantidadKeydown(event: KeyboardEvent, currentIndex: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
      const currentControl = distribucionesArray.at(currentIndex);
      
      // Validate current field
      if (currentControl.get('cantidadAsignada')?.valid) {
        // Move to next field or save button
        const nextIndex = currentIndex + 1;
        if (nextIndex < distribucionesArray.length) {
          const nextControl = distribucionesArray.at(nextIndex);
          const cantidadInput = nextControl.get('cantidadAsignada');
          if (cantidadInput) {
            setTimeout(() => {
              const inputElement = document.querySelector(`input[formControlName="cantidadAsignada"]:nth-of-type(${nextIndex + 1})`) as HTMLInputElement;
              if (inputElement) {
                inputElement.focus();
                inputElement.select();
              }
            }, 100);
          }
        } else {
          // Focus save button
          setTimeout(() => {
            this.guardarBtn?.nativeElement?.focus();
          }, 100);
        }
      } else {
        // Mark as touched to show error
        currentControl.get('cantidadAsignada')?.markAsTouched();
      }
    }
  }

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
        ? `La cantidad distribuida (${this.totalAsignadoFormattedComputed} ${this.unidadMostrarComputed}) es mayor a la solicitada (${this.cantidadEnNotaFormattedComputed} ${this.unidadMostrarComputed}).`
        : `La cantidad distribuida (${this.totalAsignadoFormattedComputed} ${this.unidadMostrarComputed}) es menor a la solicitada (${this.cantidadEnNotaFormattedComputed} ${this.unidadMostrarComputed}).`;
      this.notificacionService.openAlgoSalioMal(message);
      this.savingComputed = false;
      return;
    }

    const formValue = this.distribucionForm.value;
    const distribuciones: NotaRecepcionItemDistribucionInput[] = [];
    const distribucionesToDelete: number[] = [];

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
          const cantidadEnUnidadBase = this.convertirPresentacionAUnidadBase(cantidadAsignada);
          
          let distribucion = new NotaRecepcionItemDistribucion();
          distribucion.id = distribucionId || undefined;
          distribucion.notaRecepcionItem = this.data.item;
          distribucion.sucursalInfluencia = sucursalInfluencia!;
          distribucion.sucursalEntrega = sucursalEntrega!;
          distribucion.cantidad = cantidadEnUnidadBase;
          distribuciones.push(distribucion.toInput());
        } else {
          // MODO SIMPLIFICADO: Crear distribuciones para todas las sucursales de influencia
          const sucursalEntrega = this.data.sucursalesEntrega.find(se => se.id === d.sucursalEntrega);
          const distribucionesIds = d.distribucionesIds || [];
          
          // Convertir la cantidad total a unidades base (siempre guardamos en unidades base)
          const cantidadTotalEnUnidadBase = this.convertirPresentacionAUnidadBase(cantidadAsignada);
          
          // Distribuir proporcionalmente entre las sucursales de influencia
          const sucursalesInfluencia = this.data.sucursalesInfluencia;
          const cantidadPorSucursal = cantidadTotalEnUnidadBase / sucursalesInfluencia.length;
          
          sucursalesInfluencia.forEach((sucursalInfluencia, index) => {
            let distribucion = new NotaRecepcionItemDistribucion();
            distribucion.id = distribucionesIds[index] || undefined;
            distribucion.notaRecepcionItem = this.data.item;
            distribucion.sucursalInfluencia = sucursalInfluencia;
            distribucion.sucursalEntrega = sucursalEntrega!;
            distribucion.cantidad = cantidadPorSucursal;
            distribuciones.push(distribucion.toInput());
          });
        }
      } else if (distribucionId) {
        // Si la cantidad es 0 y existe un ID, marcar para eliminación
        if (modoVisualizacion === 'trazabilidad') {
          distribucionesToDelete.push(distribucionId);
        } else {
          // En modo simplificado, agregar todos los IDs del grupo
          const distribucionesIds = d.distribucionesIds || [];
          distribucionesIds.forEach((id: number) => {
            if (id) distribucionesToDelete.push(id);
          });
        }
      }
    });

    // Ejecutar operaciones de guardado y eliminación
    this.executeSaveOperations(distribuciones, distribucionesToDelete);
  }

  private executeSaveOperations(distribuciones: NotaRecepcionItemDistribucionInput[], distribucionesToDelete: number[]): void {
    let operationsCompleted = 0;
    let totalOperations = 0;
    let hasErrors = false;

    if (distribuciones.length > 0) totalOperations++;
    if (distribucionesToDelete.length > 0) totalOperations++;

    const checkCompletion = () => {
      operationsCompleted++;
      if (operationsCompleted >= totalOperations) {
        this.savingComputed = false;
        if (!hasErrors) {
          this.notificacionService.openSucess('Distribución guardada correctamente');
          this.dialogRef.close({
            success: true,
            action: 'save',
            message: 'Distribución actualizada correctamente'
          });
        }
      }
    };

    // Save new/updated distributions
    if (distribuciones.length > 0) {
      this.pedidoService.onReplaceNotaRecepcionItemDistribuciones(this.data.item.id, distribuciones).subscribe({
        next: (result) => {
          console.log('Distribuciones guardadas:', result);
          checkCompletion();
        },
        error: (error) => {
          console.error('Error al guardar distribuciones:', error);
          hasErrors = true;
          this.notificacionService.openAlgoSalioMal('Error al guardar las distribuciones');
          checkCompletion();
        }
      });
    } else {
      checkCompletion();
    }

    // Delete distributions
    if (distribucionesToDelete.length > 0) {
      this.pedidoService.onReplaceNotaRecepcionItemDistribuciones(this.data.item.id, []).subscribe({
        next: (result) => {
          console.log('Distribuciones eliminadas:', result);
          checkCompletion();
        },
        error: (error) => {
          console.error('Error al eliminar distribuciones:', error);
          hasErrors = true;
          this.notificacionService.openAlgoSalioMal('Error al eliminar las distribuciones');
          checkCompletion();
        }
      });
    } else {
      checkCompletion();
    }
  }

  onDeleteDistribuciones(): void {
    if (this.distribucionesSeleccionadas.length === 0) {
      this.notificacionService.openAlgoSalioMal('Seleccione al menos una distribución para eliminar');
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

    // Replace with empty array to delete all and recreate only non-selected ones
    const remainingDistribuciones: NotaRecepcionItemDistribucionInput[] = [];
    
    distribucionesArray.controls.forEach((control, index) => {
      if (!this.distribucionesSeleccionadas.includes(index)) {
        const cantidadAsignada = parseFloat(control.get('cantidadAsignada')?.value) || 0;
        if (cantidadAsignada > 0) {
          const sucursalInfluencia = this.data.sucursalesInfluencia.find(si => si.id === control.get('sucursalInfluencia')?.value);
          const sucursalEntrega = this.data.sucursalesEntrega.find(se => se.id === control.get('sucursalEntrega')?.value);
          
          // Convertir la cantidad a unidades base (siempre guardamos en unidades base)
          const cantidadEnUnidadBase = this.convertirPresentacionAUnidadBase(cantidadAsignada);
          
          let distribucion = new NotaRecepcionItemDistribucion();
          distribucion.notaRecepcionItem = this.data.item;
          distribucion.sucursalInfluencia = sucursalInfluencia!;
          distribucion.sucursalEntrega = sucursalEntrega!;
          distribucion.cantidad = cantidadEnUnidadBase;
          remainingDistribuciones.push(distribucion.toInput());
        }
      }
    });

    this.pedidoService.onReplaceNotaRecepcionItemDistribuciones(this.data.item.id, remainingDistribuciones).subscribe({
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
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close({
      success: false,
      action: 'cancel'
    });
  }

  private markFormGroupTouched(): void {
    const distribucionesArray = this.distribucionForm.get('distribuciones') as FormArray;
    distribucionesArray.controls.forEach(control => {
      control.get('cantidadAsignada')?.markAsTouched();
    });
  }

  onGuardarButtonKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSave();
    }
  }

  trackByIndex(index: number): number {
    return index;
  }
}

