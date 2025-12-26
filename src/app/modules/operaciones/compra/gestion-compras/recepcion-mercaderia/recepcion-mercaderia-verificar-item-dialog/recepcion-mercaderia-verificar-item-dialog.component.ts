import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionPanel } from '@angular/material/expansion';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, map, catchError } from 'rxjs/operators';

// Importar modelos reales
import { Sucursal } from '../../../../../empresarial/sucursal/sucursal.model';
import { NotaRecepcionItem } from '../../nota-recepcion-item.model';
import { NotaRecepcionItemDistribucion } from '../../models/nota-recepcion-item-distribucion.model';
import { Presentacion } from '../../../../../productos/presentacion/presentacion.model';
import { MotivoModificacion, MOTIVO_MODIFICACION_LABELS } from './motivo-modificacion.enum';

// Importar servicios
import { PresentacionService } from '../../../../../productos/presentacion/presentacion.service';

interface DistribucionFormData {
  sucursalId: number;
  sucursalNombre: string;
  cantidadEsperada: number;
  cantidadRecibida: number;
  vencimiento: Date | null;
  lote: string;
  observaciones: string;
  motivoModificacion: MotivoModificacion | null;
  motivoOtro: string;
  tieneDiscrepancia: boolean;
}

export interface RecepcionMercaderiaVerificarItemDialogData {
  item: NotaRecepcionItem;
  distribuciones: NotaRecepcionItemDistribucion[];
  sucursalesSeleccionadas: Sucursal[];
  presentacionesDisponibles: Presentacion[];
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-recepcion-mercaderia-verificar-item-dialog',
  templateUrl: './recepcion-mercaderia-verificar-item-dialog.component.html',
  styleUrls: ['./recepcion-mercaderia-verificar-item-dialog.component.scss']
})
export class RecepcionMercaderiaVerificarItemDialogComponent implements OnInit {
  @ViewChild('saveButton', { read: MatButton }) saveButton!: MatButton;
  @ViewChild('cancelButton', { read: MatButton }) cancelButton!: MatButton;

  private destroy$ = new Subject<void>();

  verificarForm: FormGroup;
  
  // Datos del diálogo
  item: NotaRecepcionItem;
  distribuciones: NotaRecepcionItemDistribucion[];
  sucursalesSeleccionadas: Sucursal[];
  presentacionesDisponibles: Presentacion[];
  
  // Datos de formulario
  distribucionesFormData: DistribucionFormData[] = [];
  
  // Propiedades computadas
  cantidadTotalEsperadaComputed = 0;
  cantidadTotalRecibidaComputed = 0;
  cantidadTotalRechazadaComputed = 0;
  cantidadDiferenciaComputed = 0;
  formValidComputed = false;
  hayDiscrepanciasComputed = false;
  presentacionSeleccionadaComputed: Presentacion | null = null;
  cantidadPorUnidadComputed = 0;
  loadingPresentaciones = false;

  // Enums y constantes
  MotivoModificacion = MotivoModificacion;
  MOTIVO_MODIFICACION_LABELS = MOTIVO_MODIFICACION_LABELS;
  motivosDisponibles = Object.values(MotivoModificacion);

  // Sistema de navegación por teclado
  private navigationFields: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RecepcionMercaderiaVerificarItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RecepcionMercaderiaVerificarItemDialogData,
    private presentacionService: PresentacionService
  ) {
    this.item = data.item;
    this.distribuciones = data.distribuciones;
    this.sucursalesSeleccionadas = data.sucursalesSeleccionadas;
    this.presentacionesDisponibles = data.presentacionesDisponibles;
    
    this.verificarForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadAllDataAndInitialize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllDataAndInitialize(): void {
    this.loadingPresentaciones = true;
    
    // Crear observable para cargar presentaciones
    const presentacionesObservable = this.item.producto && this.item.producto.id
      ? this.presentacionService.onGetPresentacionesPorProductoId(this.item.producto.id)
          .pipe(
            catchError(error => {
              console.error('Error cargando presentaciones del producto:', error);
              // En caso de error, usar la presentación actual del item
              return of(this.item.presentacionEnNota ? [this.item.presentacionEnNota] : []);
            })
          )
      : of([]);

    // Usar forkJoin para cargar todos los datos antes de inicializar
    forkJoin({
      presentaciones: presentacionesObservable
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (result) => {
        console.log('Todos los datos cargados:', result);
        
        // Establecer presentaciones disponibles
        this.presentacionesDisponibles = result.presentaciones;
        
        // Si no hay presentaciones disponibles, usar la presentación actual del item
        if (this.presentacionesDisponibles.length === 0 && this.item.presentacionEnNota) {
          this.presentacionesDisponibles = [this.item.presentacionEnNota];
        }
        
        // Establecer la presentación actual como seleccionada por defecto
        if (this.item.presentacionEnNota) {
          this.presentacionSeleccionadaComputed = this.presentacionesDisponibles.find(
            p => p.id === this.item.presentacionEnNota.id
          ) || this.presentacionesDisponibles[0];
        } else {
          this.presentacionSeleccionadaComputed = this.presentacionesDisponibles[0];
        }
        
        console.log('Presentación seleccionada:', this.presentacionSeleccionadaComputed);
        
        // Ahora inicializar todo con los datos cargados
        this.initializeDistribucionesFormData();
        this.initializeForm();
        this.setupFormSubscriptions();
        this.setupKeyboardNavigation();
        this.updateComputedProperties();
        
        this.loadingPresentaciones = false;
      },
      error: (error) => {
        console.error('Error cargando datos:', error);
        this.loadingPresentaciones = false;
        
        // Inicializar con datos por defecto en caso de error
        this.initializeDistribucionesFormData();
        this.initializeForm();
        this.setupFormSubscriptions();
        this.setupKeyboardNavigation();
        this.updateComputedProperties();
      }
    });
  }



  private initializeDistribucionesFormData(): void {
    // Validar que las distribuciones estén disponibles
    if (!this.distribuciones || this.distribuciones.length === 0) {
      console.warn('No hay distribuciones disponibles, creando distribución por defecto');
      
      // Crear una distribución por defecto basada en las sucursales seleccionadas
      // Las cantidades se calcularán correctamente cuando se seleccione la presentación
      this.distribucionesFormData = this.sucursalesSeleccionadas.map(sucursal => ({
        sucursalId: sucursal.id,
        sucursalNombre: sucursal.nombre,
        cantidadEsperada: 0, // Se calculará basado en la presentación
        cantidadRecibida: 0, // Se calculará basado en la presentación
        vencimiento: this.item.vencimientoEnNota,
        lote: '',
        observaciones: '',
        motivoModificacion: null,
        motivoOtro: '',
        tieneDiscrepancia: false
      }));
    } else {
      // Convertir las cantidades de las distribuciones existentes a unidades de presentación
      this.distribucionesFormData = this.distribuciones.map(dist => {
        const presentacion = this.item.presentacionEnNota;
        const cantidadEnPresentacion = presentacion ? dist.cantidad / presentacion.cantidad : dist.cantidad;
        
        return {
          sucursalId: dist.sucursalEntrega.id,
          sucursalNombre: dist.sucursalEntrega.nombre,
          cantidadEsperada: cantidadEnPresentacion,
          cantidadRecibida: cantidadEnPresentacion, // Pre-cargar con cantidad esperada
          vencimiento: this.item.vencimientoEnNota,
          lote: '',
          observaciones: '',
          motivoModificacion: null,
          motivoOtro: '',
          tieneDiscrepancia: false
        };
      });
    }
  }

  private initializeForm(): void {
    const formControls: { [key: string]: any } = {
      presentacionGlobal: [this.presentacionSeleccionadaComputed] // Usar la presentación ya seleccionada
    };

    // Crear controles para cada distribución
    this.distribucionesFormData.forEach((dist, index) => {
      const prefix = `dist_${index}`;
      
      formControls[`${prefix}_cantidadRecibida`] = [
        dist.cantidadRecibida,
        [Validators.required, Validators.min(0), Validators.max(dist.cantidadEsperada)]
      ];
      
      formControls[`${prefix}_vencimiento`] = [dist.vencimiento];
      formControls[`${prefix}_lote`] = ['', [Validators.maxLength(50)]];
      formControls[`${prefix}_observaciones`] = ['', [Validators.maxLength(500)]];
      formControls[`${prefix}_motivoModificacion`] = [null];
      formControls[`${prefix}_motivoOtro`] = ['', [Validators.maxLength(200)]];
    });

    this.verificarForm = this.fb.group(formControls);
    
    console.log('Formulario inicializado con presentación:', this.presentacionSeleccionadaComputed);
  }

  private setupFormSubscriptions(): void {
    // Suscribirse a cambios en el formulario para actualizar propiedades computadas
    this.verificarForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateComputedProperties();
      });
  }

  private updateComputedProperties(): void {
    // Obtener presentación seleccionada del formulario
    const presentacionAnterior = this.presentacionSeleccionadaComputed;
    const presentacionDelFormulario = this.verificarForm.get('presentacionGlobal')?.value;
    
    console.log('presentacionAnterior ', presentacionAnterior);
    console.log('presentacionDelFormulario ', presentacionDelFormulario);
    
    // Solo actualizar si hay un valor en el formulario y es diferente
    if (presentacionDelFormulario) {
      this.presentacionSeleccionadaComputed = presentacionDelFormulario;
    }
    
    console.log('this.presentacionSeleccionadaComputed final ', this.presentacionSeleccionadaComputed);

    // Calcular cantidad por unidad basada en la presentación
    this.cantidadPorUnidadComputed = this.presentacionSeleccionadaComputed?.cantidad || 1;

    // Si cambió la presentación, recalcular cantidades esperadas
    if (presentacionAnterior?.id !== this.presentacionSeleccionadaComputed?.id) {
      this.recalcularCantidadesBasadasEnPresentacion();
    }

    // Calcular cantidad total esperada
    this.cantidadTotalEsperadaComputed = this.distribucionesFormData.reduce((total, dist) => total + dist.cantidadEsperada, 0);

    // Calcular cantidad total recibida
    this.cantidadTotalRecibidaComputed = this.distribucionesFormData.reduce((total, dist, index) => {
      const cantidad = this.verificarForm.get(`dist_${index}_cantidadRecibida`)?.value || 0;
      return total + cantidad;
    }, 0);

    // Calcular diferencia
    this.cantidadDiferenciaComputed = this.cantidadTotalEsperadaComputed - this.cantidadTotalRecibidaComputed;

    // Verificar si hay discrepancias
    this.hayDiscrepanciasComputed = this.distribucionesFormData.some((dist, index) => {
      const cantidadRecibida = this.verificarForm.get(`dist_${index}_cantidadRecibida`)?.value || 0;
      return cantidadRecibida !== dist.cantidadEsperada;
    });

    // Actualizar datos de formulario
    this.distribucionesFormData.forEach((dist, index) => {
      const cantidadRecibida = this.verificarForm.get(`dist_${index}_cantidadRecibida`)?.value || 0;
      dist.cantidadRecibida = cantidadRecibida;
      dist.tieneDiscrepancia = cantidadRecibida !== dist.cantidadEsperada;
      dist.vencimiento = this.verificarForm.get(`dist_${index}_vencimiento`)?.value;
      dist.lote = this.verificarForm.get(`dist_${index}_lote`)?.value || '';
      dist.observaciones = this.verificarForm.get(`dist_${index}_observaciones`)?.value || '';
      dist.motivoModificacion = this.verificarForm.get(`dist_${index}_motivoModificacion`)?.value;
      dist.motivoOtro = this.verificarForm.get(`dist_${index}_motivoOtro`)?.value || '';
    });

    // Validar formulario
    this.formValidComputed = this.verificarForm.valid && 
      this.cantidadTotalRecibidaComputed > 0 &&
      this.validarMotivosDiscrepancias();
  }

  private recalcularCantidadesBasadasEnPresentacion(): void {
    if (!this.presentacionSeleccionadaComputed) return;

    const cantidadBase = this.item.cantidadEnNota; // Cantidad en unidades base (ej: 60 unidades)
    const cantidadPorPresentacion = this.presentacionSeleccionadaComputed.cantidad; // Unidades por presentación (ej: 6)
    
    // Calcular cantidad en unidades de presentación (ej: 60 / 6 = 10 presentaciones)
    const cantidadEnPresentaciones = cantidadBase / cantidadPorPresentacion;
    
    // Distribuir las presentaciones entre las sucursales
    const cantidadPorSucursal = Math.floor(cantidadEnPresentaciones / this.distribucionesFormData.length);
    const cantidadRestante = cantidadEnPresentaciones % this.distribucionesFormData.length;
    
    this.distribucionesFormData.forEach((dist, index) => {
      // La cantidad esperada ahora es en unidades de presentación
      dist.cantidadEsperada = cantidadPorSucursal + (index < cantidadRestante ? 1 : 0);
      
      // Actualizar el valor del formulario si no ha sido modificado por el usuario
      const control = this.verificarForm.get(`dist_${index}_cantidadRecibida`);
      if (control && !control.dirty) {
        control.setValue(dist.cantidadEsperada);
      }
    });
    
    console.log('Recálculo de cantidades basado en presentación:', {
      cantidadBase,
      cantidadPorPresentacion,
      cantidadEnPresentaciones,
      distribuciones: this.distribucionesFormData.map(d => ({
        sucursal: d.sucursalNombre,
        cantidadEsperada: d.cantidadEsperada
      }))
    });
  }

  private validarMotivosDiscrepancias(): boolean {
    return this.distribucionesFormData.every((dist, index) => {
      if (!dist.tieneDiscrepancia) return true;
      
      const motivoModificacion = this.verificarForm.get(`dist_${index}_motivoModificacion`)?.value;
      const motivoOtro = this.verificarForm.get(`dist_${index}_motivoOtro`)?.value;
      
      return motivoModificacion && (motivoModificacion !== MotivoModificacion.OTRO || motivoOtro.trim());
    });
  }

  private setupKeyboardNavigation(): void {
    // Definir el orden de navegación de campos
    this.navigationFields = ['presentacionGlobal'];
    
    this.distribucionesFormData.forEach((dist, index) => {
      const prefix = `dist_${index}`;
      this.navigationFields.push(
        `${prefix}_cantidadRecibida`,
        `${prefix}_vencimiento`,
        `${prefix}_lote`,
        `${prefix}_observaciones`
      );
      
      // Agregar campos de motivo si hay discrepancia
      if (dist.tieneDiscrepancia) {
        this.navigationFields.push(`${prefix}_motivoModificacion`, `${prefix}_motivoOtro`);
      }
    });
  }

  onKeyDown(event: KeyboardEvent, currentField: string): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      
      // Validar campo actual antes de navegar
      const currentControl = this.verificarForm.get(currentField);
      if (currentControl && !currentControl.valid) {
        currentControl.markAsTouched();
        this.updateComputedProperties();
        return;
      }
      
      this.navigateToNextField(currentField);
    }
  }

  private navigateToNextField(currentField: string): void {
    const currentIndex = this.navigationFields.indexOf(currentField);
    if (currentIndex === -1 || currentIndex === this.navigationFields.length - 1) {
      // Si es el último campo o no se encuentra, enfocar el botón de guardar
      setTimeout(() => {
        this.saveButton?.focus();
      }, 100);
      return;
    }

    const nextField = this.navigationFields[currentIndex + 1];
    const nextElement = document.querySelector(`[formControlName="${nextField}"]`) as HTMLElement;
    
    if (nextElement) {
      setTimeout(() => {
        nextElement.focus();
      }, 100);
    }
  }

  onSave(): void {
    if (!this.formValidComputed) {
      return;
    }

    // Preparar datos para guardar
    const result = {
      itemId: this.item.id,
      presentacionId: this.presentacionSeleccionadaComputed?.id,
      distribuciones: this.distribucionesFormData.map((dist, index) => {
        // Convertir cantidad de presentación a unidades base para el backend
        const cantidadEnUnidadesBase = this.presentacionSeleccionadaComputed?.cantidad 
          ? dist.cantidadRecibida * this.presentacionSeleccionadaComputed.cantidad 
          : dist.cantidadRecibida;
        
        return {
          sucursalId: dist.sucursalId,
          cantidadRecibida: cantidadEnUnidadesBase, // Convertir a unidades base para el backend
          vencimiento: dist.vencimiento,
          lote: dist.lote,
          observaciones: dist.observaciones,
          motivoModificacion: dist.motivoModificacion,
          motivoOtro: dist.motivoOtro,
          tieneDiscrepancia: dist.tieneDiscrepancia
        };
      })
    };

    console.log('Datos a guardar:', result);
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Métodos auxiliares para UI
  getCantidadRecibidaControl(index: number) {
    return this.verificarForm.get(`dist_${index}_cantidadRecibida`);
  }

  getVencimientoControl(index: number) {
    return this.verificarForm.get(`dist_${index}_vencimiento`);
  }

  getLoteControl(index: number) {
    return this.verificarForm.get(`dist_${index}_lote`);
  }

  getObservacionesControl(index: number) {
    return this.verificarForm.get(`dist_${index}_observaciones`);
  }

  getMotivoModificacionControl(index: number) {
    return this.verificarForm.get(`dist_${index}_motivoModificacion`);
  }

  getMotivoOtroControl(index: number) {
    return this.verificarForm.get(`dist_${index}_motivoOtro`);
  }

  isCantidadValid(index: number): boolean {
    const control = this.getCantidadRecibidaControl(index);
    return control ? control.valid : true;
  }

  getCantidadDiferencia(index: number): number {
    const dist = this.distribucionesFormData[index];
    return dist.cantidadEsperada - dist.cantidadRecibida;
  }

  onMotivoModificacionChange(index: number): void {
    const motivoControl = this.getMotivoModificacionControl(index);
    const motivoOtroControl = this.getMotivoOtroControl(index);
    
    if (motivoControl?.value === MotivoModificacion.OTRO) {
      motivoOtroControl?.enable();
    } else {
      motivoOtroControl?.disable();
      motivoOtroControl?.setValue('');
    }
  }

  onPresentacionChange(): void {
    console.log('Presentación cambiada a:', this.presentacionSeleccionadaComputed);
    // El updateComputedProperties ya maneja el recálculo cuando cambia la presentación
    this.updateComputedProperties();
  }

  // Función de comparación para mat-select
  comparePresentaciones(presentacion1: any, presentacion2: any): boolean {
    return presentacion1 && presentacion2 && presentacion1.id === presentacion2.id;
  }
} 