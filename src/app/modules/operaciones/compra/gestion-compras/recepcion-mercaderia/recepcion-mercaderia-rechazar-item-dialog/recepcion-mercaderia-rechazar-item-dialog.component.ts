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
import { MotivoRechazoFisico, MOTIVO_RECHAZO_FISICO_OPTIONS } from '../models/motivo-rechazo-fisico.model';

// Importar servicios
import { PresentacionService } from '../../../../../productos/presentacion/presentacion.service';

interface DistribucionRechazoFormData {
  sucursalId: number;
  sucursalNombre: string;
  cantidadEsperada: number;
  cantidadRechazada: number;
  motivoRechazo: MotivoRechazoFisico | null;
  observaciones: string;
  tieneRechazo: boolean;
}

export interface RecepcionMercaderiaRechazarItemDialogData {
  item: NotaRecepcionItem;
  distribuciones: NotaRecepcionItemDistribucion[];
  sucursalesSeleccionadas: Sucursal[];
  presentacionesDisponibles: Presentacion[];
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-recepcion-mercaderia-rechazar-item-dialog',
  templateUrl: './recepcion-mercaderia-rechazar-item-dialog.component.html',
  styleUrls: ['./recepcion-mercaderia-rechazar-item-dialog.component.scss']
})
export class RecepcionMercaderiaRechazarItemDialogComponent implements OnInit {
  @ViewChild('saveButton', { read: MatButton }) saveButton!: MatButton;
  @ViewChild('cancelButton', { read: MatButton }) cancelButton!: MatButton;

  private destroy$ = new Subject<void>();

  rechazarForm: FormGroup;
  
  // Datos del diálogo
  item: NotaRecepcionItem;
  distribuciones: NotaRecepcionItemDistribucion[];
  sucursalesSeleccionadas: Sucursal[];
  presentacionesDisponibles: Presentacion[];
  
  // Datos de formulario
  distribucionesFormData: DistribucionRechazoFormData[] = [];
  
  // Propiedades computadas
  cantidadTotalEsperadaComputed = 0;
  cantidadTotalRechazadaComputed = 0;
  cantidadDisponibleComputed = 0;
  formValidComputed = false;
  hayRechazosComputed = false;
  presentacionSeleccionadaComputed: Presentacion | null = null;
  cantidadPorUnidadComputed = 0;
  loadingPresentaciones = false;

  // Enums y constantes
  motivosRechazo = MOTIVO_RECHAZO_FISICO_OPTIONS;

  // Sistema de navegación por teclado
  private navigationFields: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RecepcionMercaderiaRechazarItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RecepcionMercaderiaRechazarItemDialogData,
    private presentacionService: PresentacionService
  ) {
    this.item = data.item;
    this.distribuciones = data.distribuciones;
    this.sucursalesSeleccionadas = data.sucursalesSeleccionadas;
    this.presentacionesDisponibles = data.presentacionesDisponibles;
    
    console.log('=== DATOS RECIBIDOS EN DIALOGO DE RECHAZO ===');
    console.log('Item:', this.item);
    console.log('Distribuciones:', this.distribuciones);
    console.log('Sucursales seleccionadas:', this.sucursalesSeleccionadas);
    console.log('Presentaciones disponibles:', this.presentacionesDisponibles);
    
    this.rechazarForm = this.fb.group({});
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
    console.log('=== INICIALIZANDO DISTRIBUCIONES DE RECHAZO ===');
    console.log('Distribuciones disponibles:', this.distribuciones);
    console.log('Sucursales seleccionadas:', this.sucursalesSeleccionadas);
    
    // Verificar si hay distribuciones agrupadas
    const distribucionesAgrupadas = (this.distribuciones as any[]).filter(d => d.distribucionesOriginales && d.distribucionesOriginales.length > 1);
    if (distribucionesAgrupadas.length > 0) {
      console.log('⚠️ DISTRIBUCIONES AGRUPADAS DETECTADAS:', distribucionesAgrupadas.map(d => ({
        sucursal: d.sucursalEntrega.nombre,
        cantidadTotal: d.cantidad,
        distribucionesOriginales: d.distribucionesOriginales.length
      })));
    }
    
    // Validar que las distribuciones estén disponibles
    if (!this.distribuciones || this.distribuciones.length === 0) {
      console.warn('No hay distribuciones disponibles, creando distribución por defecto');
      
      // Validar que las sucursales estén disponibles
      if (!this.sucursalesSeleccionadas || this.sucursalesSeleccionadas.length === 0) {
        console.error('No hay sucursales seleccionadas disponibles');
        this.distribucionesFormData = [];
        return;
      }
      
      // Crear una distribución por defecto basada en las sucursales seleccionadas
      // Las cantidades se calcularán correctamente cuando se seleccione la presentación
      this.distribucionesFormData = this.sucursalesSeleccionadas.map(sucursal => ({
        sucursalId: sucursal.id,
        sucursalNombre: sucursal.nombre,
        cantidadEsperada: 0, // Se calculará basado en la presentación
        cantidadRechazada: 0, // Se calculará basado en la presentación
        motivoRechazo: null,
        observaciones: '',
        tieneRechazo: false
      }));
      
      console.log('Distribuciones por defecto creadas:', this.distribucionesFormData);
    } else {
      // Convertir las cantidades de las distribuciones existentes a unidades de presentación
      this.distribucionesFormData = this.distribuciones.map(dist => {
        const presentacion = this.item.presentacionEnNota;
        const cantidadEnPresentacion = presentacion ? dist.cantidad / presentacion.cantidad : dist.cantidad;
        
        const distribucionData = {
          sucursalId: dist.sucursalEntrega.id,
          sucursalNombre: dist.sucursalEntrega.nombre,
          cantidadEsperada: cantidadEnPresentacion,
          cantidadRechazada: 0, // Inicialmente no hay rechazo
          motivoRechazo: null,
          observaciones: '',
          tieneRechazo: false
        };
        
        console.log('Distribución procesada:', {
          sucursal: dist.sucursalEntrega.nombre,
          cantidadOriginal: dist.cantidad,
          cantidadEnPresentacion: cantidadEnPresentacion,
          presentacion: presentacion?.descripcion,
          esAgrupada: (dist as any).distribucionesOriginales && (dist as any).distribucionesOriginales.length > 1
        });
        
        return distribucionData;
      });
      
      console.log('Distribuciones procesadas:', this.distribucionesFormData);
    }
  }

  private initializeForm(): void {
    const formControls: { [key: string]: any } = {
      presentacionGlobal: [this.presentacionSeleccionadaComputed] // Usar la presentación ya seleccionada
    };

    // Crear controles para cada distribución
    this.distribucionesFormData.forEach((dist, index) => {
      const prefix = `dist_${index}`;
      
      formControls[`${prefix}_cantidadRechazada`] = [
        dist.cantidadRechazada,
        [Validators.required, Validators.min(0), Validators.max(dist.cantidadEsperada)]
      ];
      
      formControls[`${prefix}_motivoRechazo`] = [null];
      formControls[`${prefix}_observaciones`] = ['', [Validators.maxLength(500)]];
    });

    this.rechazarForm = this.fb.group(formControls);
    
    console.log('Formulario inicializado con presentación:', this.presentacionSeleccionadaComputed);
  }

  private setupFormSubscriptions(): void {
    // Suscribirse a cambios en el formulario para actualizar propiedades computadas
    this.rechazarForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateComputedProperties();
      });
  }

  private updateComputedProperties(): void {
    // Obtener presentación seleccionada del formulario
    const presentacionAnterior = this.presentacionSeleccionadaComputed;
    const presentacionDelFormulario = this.rechazarForm.get('presentacionGlobal')?.value;
    
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

    // Calcular cantidad total rechazada
    this.cantidadTotalRechazadaComputed = this.distribucionesFormData.reduce((total, dist, index) => {
      const cantidad = this.rechazarForm.get(`dist_${index}_cantidadRechazada`)?.value || 0;
      return total + cantidad;
    }, 0);

    // Calcular cantidad disponible
    this.cantidadDisponibleComputed = this.cantidadTotalEsperadaComputed - this.cantidadTotalRechazadaComputed;

    // Verificar si hay rechazos
    this.hayRechazosComputed = this.distribucionesFormData.some((dist, index) => {
      const cantidadRechazada = this.rechazarForm.get(`dist_${index}_cantidadRechazada`)?.value || 0;
      return cantidadRechazada > 0;
    });

    // Actualizar datos de formulario
    this.distribucionesFormData.forEach((dist, index) => {
      const cantidadRechazada = this.rechazarForm.get(`dist_${index}_cantidadRechazada`)?.value || 0;
      dist.cantidadRechazada = cantidadRechazada;
      dist.tieneRechazo = cantidadRechazada > 0;
      dist.motivoRechazo = this.rechazarForm.get(`dist_${index}_motivoRechazo`)?.value;
      dist.observaciones = this.rechazarForm.get(`dist_${index}_observaciones`)?.value || '';
    });

    // Validar formulario
    this.formValidComputed = this.rechazarForm.valid && 
      this.cantidadTotalRechazadaComputed > 0 &&
      this.validarMotivosRechazo();
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
      const control = this.rechazarForm.get(`dist_${index}_cantidadRechazada`);
      if (control && !control.dirty) {
        control.setValue(0); // Inicialmente no hay rechazo
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

  private validarMotivosRechazo(): boolean {
    return this.distribucionesFormData.every((dist, index) => {
      if (!dist.tieneRechazo) return true;
      
      const motivoRechazo = this.rechazarForm.get(`dist_${index}_motivoRechazo`)?.value;
      
      return motivoRechazo && motivoRechazo.trim();
    });
  }

  private setupKeyboardNavigation(): void {
    // Definir el orden de navegación de campos
    this.navigationFields = ['presentacionGlobal'];
    
    this.distribucionesFormData.forEach((dist, index) => {
      const prefix = `dist_${index}`;
      this.navigationFields.push(
        `${prefix}_cantidadRechazada`,
        `${prefix}_motivoRechazo`,
        `${prefix}_observaciones`
      );
    });
  }

  onKeyDown(event: KeyboardEvent, currentField: string): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      
      // Validar campo actual antes de navegar
      const currentControl = this.rechazarForm.get(currentField);
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
      rechazos: this.distribucionesFormData
        .filter(dist => dist.cantidadRechazada > 0)
        .map((dist, index) => {
          // Convertir cantidad de presentación a unidades base para el backend
          const cantidadEnUnidadesBase = this.presentacionSeleccionadaComputed?.cantidad 
            ? dist.cantidadRechazada * this.presentacionSeleccionadaComputed.cantidad 
            : dist.cantidadRechazada;
          
          return {
            sucursalId: dist.sucursalId,
            cantidadRechazada: cantidadEnUnidadesBase, // Convertir a unidades base para el backend
            motivoRechazo: dist.motivoRechazo,
            observaciones: dist.observaciones
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
  getCantidadRechazadaControl(index: number) {
    return this.rechazarForm.get(`dist_${index}_cantidadRechazada`);
  }

  getMotivoRechazoControl(index: number) {
    return this.rechazarForm.get(`dist_${index}_motivoRechazo`);
  }

  getObservacionesControl(index: number) {
    return this.rechazarForm.get(`dist_${index}_observaciones`);
  }

  isCantidadValid(index: number): boolean {
    const control = this.getCantidadRechazadaControl(index);
    return control ? control.valid : true;
  }

  onMotivoRechazoChange(index: number): void {
    // Lógica específica para cambio de motivo de rechazo si es necesaria
    console.log('Motivo de rechazo cambiado para índice:', index);
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