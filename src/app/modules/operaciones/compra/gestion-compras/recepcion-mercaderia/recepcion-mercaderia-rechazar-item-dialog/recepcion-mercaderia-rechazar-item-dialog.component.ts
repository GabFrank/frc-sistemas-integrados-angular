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
  notaRecepcionItemDistribucionId?: number;
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
        
        // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.updateComputedProperties();
        }, 0);
        
        // NO distribuir automáticamente al iniciar - el usuario debe ingresar la cantidad manualmente
        // La distribución automática se activará cuando el usuario ingrese un valor en cantidadTotalRechazo
        
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
        
        // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.updateComputedProperties();
        }, 0);
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
        tieneRechazo: false,
        notaRecepcionItemDistribucionId: undefined
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
          tieneRechazo: false,
          notaRecepcionItemDistribucionId: dist.id
        };
        
        console.log('Distribución procesada:', {
          sucursal: dist.sucursalEntrega.nombre,
          cantidadOriginal: dist.cantidad,
          cantidadEnPresentacion: cantidadEnPresentacion,
          presentacion: presentacion?.descripcion,
          distribucionId: dist.id,
          esAgrupada: (dist as any).distribucionesOriginales && (dist as any).distribucionesOriginales.length > 1
        });
        
        return distribucionData;
      });
      
      console.log('Distribuciones procesadas:', this.distribucionesFormData);
    }
  }

  private initializeForm(): void {
    const formControls: { [key: string]: any } = {
      presentacionGlobal: [this.presentacionSeleccionadaComputed], // Usar la presentación ya seleccionada
      cantidadTotalRechazo: [0, [Validators.min(0)]], // Campo para cantidad total de rechazo (inicia en cero)
      motivoRechazoGlobal: [null], // Motivo de rechazo general (no requerido inicialmente, solo cuando hay rechazos)
      observacionesGlobal: ['', [Validators.maxLength(500)]] // Observaciones generales
    };

    // Crear controles para cada distribución (solo cantidad, sin motivo ni observaciones individuales)
    this.distribucionesFormData.forEach((dist, index) => {
      const prefix = `dist_${index}`;
      
      formControls[`${prefix}_cantidadRechazada`] = [
        0, // Inicializar en cero
        [Validators.min(0), Validators.max(dist.cantidadEsperada)]
      ];
    });

    this.rechazarForm = this.fb.group(formControls);
    
    console.log('Formulario inicializado con presentación:', this.presentacionSeleccionadaComputed);
  }

  private setupFormSubscriptions(): void {
    // Suscribirse a cambios en el campo de cantidad total de rechazo para distribuir automáticamente
    const cantidadTotalControl = this.rechazarForm.get('cantidadTotalRechazo');
    if (cantidadTotalControl) {
      cantidadTotalControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((cantidadTotal) => {
          // Solo distribuir si hay una cantidad válida y hay múltiples distribuciones
          if (cantidadTotal && cantidadTotal > 0 && this.presentacionSeleccionadaComputed && this.distribucionesFormData.length > 1) {
            // Convertir a unidades base
            const cantidadEnBase = cantidadTotal * (this.presentacionSeleccionadaComputed.cantidad || 1);
            console.log('Cantidad total de rechazo ingresada:', cantidadTotal, 'presentaciones →', cantidadEnBase, 'unidades base');
            // Distribuir proporcionalmente (usar emitEvent: false para evitar bucle infinito)
            this.distribuirRechazoProporcionalmente(cantidadEnBase);
          }
        });
    }
    
    // Suscribirse a cambios en el formulario para actualizar propiedades computadas
    // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    this.rechazarForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => {
          this.updateComputedProperties();
        }, 0);
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

    // Obtener motivo y observaciones globales
    const motivoRechazoGlobal = this.rechazarForm.get('motivoRechazoGlobal')?.value;
    const observacionesGlobal = this.rechazarForm.get('observacionesGlobal')?.value || '';

    // Actualizar datos de formulario
    this.distribucionesFormData.forEach((dist, index) => {
      const cantidadRechazada = this.rechazarForm.get(`dist_${index}_cantidadRechazada`)?.value || 0;
      dist.cantidadRechazada = cantidadRechazada;
      dist.tieneRechazo = cantidadRechazada > 0;
      // Usar motivo y observaciones globales para todas las distribuciones
      dist.motivoRechazo = motivoRechazoGlobal;
      dist.observaciones = observacionesGlobal;
    });

    // Validar motivo solo si hay rechazos - usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      const motivoControl = this.rechazarForm.get('motivoRechazoGlobal');
      if (this.hayRechazosComputed) {
        if (!motivoControl?.value) {
          motivoControl?.setErrors({ required: true });
          motivoControl?.markAsTouched();
        } else {
          const errors = motivoControl.errors;
          if (errors) {
            delete errors['required'];
            if (Object.keys(errors).length === 0) {
              motivoControl.setErrors(null);
            } else {
              motivoControl.setErrors(errors);
            }
          }
        }
      } else if (motivoControl) {
        // Si no hay rechazos, limpiar errores del motivo
        const errors = motivoControl.errors;
        if (errors) {
          delete errors['required'];
          if (Object.keys(errors).length === 0) {
            motivoControl.setErrors(null);
          } else {
            motivoControl.setErrors(errors);
          }
        }
      }
      
      // Validar formulario
      this.formValidComputed = this.rechazarForm.valid && 
        this.cantidadTotalRechazadaComputed > 0 &&
        this.validarMotivosRechazo();
    }, 0);
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
      
      // NO establecer valores en los controles aquí - solo actualizar la cantidad esperada
      // Los controles ya están inicializados en 0 en initializeForm()
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
    // Validar que hay motivo global si hay algún rechazo
    if (!this.hayRechazosComputed) {
      return true; // No hay rechazos, no necesita validación
    }
    
    const motivoRechazoGlobal = this.rechazarForm.get('motivoRechazoGlobal')?.value;
    return motivoRechazoGlobal && motivoRechazoGlobal.trim();
  }

  /**
   * Distribuye un rechazo parcial proporcionalmente entre múltiples distribuciones
   * Considera presentaciones y redondea inteligentemente
   */
  distribuirRechazoProporcionalmente(cantidadRechazadaTotal: number): void {
    if (!this.presentacionSeleccionadaComputed) {
      console.warn('No hay presentación seleccionada para distribuir rechazo');
      return;
    }

    if (this.distribucionesFormData.length === 0) {
      console.warn('No hay distribuciones para distribuir rechazo');
      return;
    }

    const cantidadPorPresentacion = this.presentacionSeleccionadaComputed.cantidad;
    const rechazoEnPresentaciones = cantidadRechazadaTotal / cantidadPorPresentacion;

    console.log('=== DISTRIBUCIÓN PROPORCIONAL DE RECHAZO ===');
    console.log('Cantidad rechazada total (unidades base):', cantidadRechazadaTotal);
    console.log('Cantidad por presentación:', cantidadPorPresentacion);
    console.log('Rechazo en presentaciones:', rechazoEnPresentaciones);

    // Si el rechazo es menor que una unidad de presentación
    if (rechazoEnPresentaciones < 1) {
      console.log('Rechazo menor que una unidad de presentación, asignando todo a la distribución con mayor cantidad');
      // Asignar todo a la distribución con mayor cantidad
      const distMayor = this.distribucionesFormData.reduce((max, dist) => 
        dist.cantidadEsperada > max.cantidadEsperada ? dist : max
      );
      const indexMayor = this.distribucionesFormData.indexOf(distMayor);
      
      // Convertir a unidades de presentación y luego a unidades base
      const cantidadEnPresentacion = cantidadRechazadaTotal / cantidadPorPresentacion;
      const control = this.rechazarForm.get(`dist_${indexMayor}_cantidadRechazada`);
      if (control) {
        control.setValue(cantidadEnPresentacion);
        control.markAsDirty();
      }
      
      console.log('Rechazo asignado a distribución:', distMayor.sucursalNombre, 'Cantidad:', cantidadEnPresentacion);
      setTimeout(() => {
        this.updateComputedProperties();
      }, 0);
      return;
    }

    // Calcular total de cantidades esperadas (en unidades de presentación)
    const cantidadTotalEnPresentacion = this.distribucionesFormData.reduce((sum, dist) => {
      return sum + dist.cantidadEsperada;
    }, 0);

    console.log('Cantidad total esperada (en presentaciones):', cantidadTotalEnPresentacion);

    // Distribuir proporcionalmente
    const distribucionesConRechazo = this.distribucionesFormData.map((dist, index) => {
      const proporcion = dist.cantidadEsperada / cantidadTotalEnPresentacion;
      const rechazoCalculado = rechazoEnPresentaciones * proporcion;
      
      return {
        index,
        distribucion: dist,
        proporcion,
        rechazoEnPresentaciones: rechazoCalculado
      };
    });

    // Ordenar por cantidad esperada (mayor primero)
    distribucionesConRechazo.sort((a, b) => b.distribucion.cantidadEsperada - a.distribucion.cantidadEsperada);

    console.log('Distribuciones con rechazo calculado:', distribucionesConRechazo.map(d => ({
      sucursal: d.distribucion.sucursalNombre,
      proporcion: d.proporcion,
      rechazoEnPresentaciones: d.rechazoEnPresentaciones
    })));

    // Redondear: hacia arriba para la mayor, hacia abajo para las demás
    let rechazoRestante = rechazoEnPresentaciones;
    const rechazosAsignados: { index: number; cantidad: number }[] = [];

    distribucionesConRechazo.forEach((dist, arrayIndex) => {
      let rechazoRedondeado: number;
      
      if (arrayIndex === 0) {
        // Primera (mayor): redondear hacia arriba
        rechazoRedondeado = Math.ceil(dist.rechazoEnPresentaciones);
      } else if (arrayIndex === distribucionesConRechazo.length - 1) {
        // Última: usar el resto para que sume exacto
        rechazoRedondeado = rechazoRestante;
      } else {
        // Resto: redondear hacia abajo
        rechazoRedondeado = Math.floor(dist.rechazoEnPresentaciones);
      }

      rechazoRestante -= rechazoRedondeado;
      rechazosAsignados.push({
        index: dist.index,
        cantidad: rechazoRedondeado
      });

      console.log(`Distribución ${dist.distribucion.sucursalNombre}: ${dist.rechazoEnPresentaciones.toFixed(2)} → ${rechazoRedondeado} presentaciones`);
    });

    // Aplicar los rechazos calculados a los controles del formulario
    rechazosAsignados.forEach(({ index, cantidad }) => {
      const control = this.rechazarForm.get(`dist_${index}_cantidadRechazada`);
      if (control) {
        control.setValue(cantidad, { emitEvent: false }); // Usar emitEvent: false para evitar bucle infinito
        control.markAsDirty();
      }
    });

    console.log('=== DISTRIBUCIÓN COMPLETADA ===');
    console.log('Total rechazo asignado:', rechazosAsignados.reduce((sum, r) => sum + r.cantidad, 0), 'presentaciones');
    console.log('Total esperado:', rechazoEnPresentaciones, 'presentaciones');

    // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.updateComputedProperties();
    }, 0);
  }

  /**
   * Método público para distribuir rechazo automáticamente desde el template
   * Distribuye la cantidad total de rechazo del campo global proporcionalmente
   */
  onDistribuirRechazoAutomaticamente(): void {
    if (!this.presentacionSeleccionadaComputed) {
      console.warn('No hay presentación seleccionada');
      return;
    }

    // Obtener cantidad total de rechazo del campo global
    const cantidadTotalRechazo = this.rechazarForm.get('cantidadTotalRechazo')?.value || 0;
    
    if (cantidadTotalRechazo <= 0) {
      // Si no hay cantidad, calcular cantidad total esperada y usar un porcentaje pequeño (5%)
      const cantidadTotalEsperadaEnBase = this.distribucionesFormData.reduce((sum, dist) => {
        const cantidadEnBase = dist.cantidadEsperada * (this.presentacionSeleccionadaComputed?.cantidad || 1);
        return sum + cantidadEnBase;
      }, 0);
      
      // Usar 5% de la cantidad esperada como ejemplo
      const cantidadPorDefecto = Math.max(1, Math.floor(cantidadTotalEsperadaEnBase * 0.05));
      const cantidadPorDefectoEnPresentacion = cantidadPorDefecto / (this.presentacionSeleccionadaComputed?.cantidad || 1);
      console.log('Distribuyendo cantidad por defecto (5%):', cantidadPorDefecto, 'unidades base');
      // Establecer en el campo y dejar que valueChanges lo distribuya
      this.rechazarForm.get('cantidadTotalRechazo')?.setValue(cantidadPorDefectoEnPresentacion, { emitEvent: false });
      this.distribuirRechazoProporcionalmente(cantidadPorDefecto);
    } else {
      // Convertir a unidades base y distribuir
      const cantidadEnBase = cantidadTotalRechazo * (this.presentacionSeleccionadaComputed?.cantidad || 1);
      console.log('Distribuyendo cantidad del campo global:', cantidadTotalRechazo, 'presentaciones →', cantidadEnBase, 'unidades base');
      this.distribuirRechazoProporcionalmente(cantidadEnBase);
    }
  }

  private setupKeyboardNavigation(): void {
    // Definir el orden de navegación de campos
    this.navigationFields = ['presentacionGlobal'];
    
    // Agregar campo de cantidad total de rechazo si hay múltiples distribuciones
    if (this.distribucionesFormData.length > 1) {
      this.navigationFields.push('cantidadTotalRechazo');
    }
    
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
            notaRecepcionItemDistribucionId: dist.notaRecepcionItemDistribucionId,
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