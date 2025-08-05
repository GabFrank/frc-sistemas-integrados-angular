import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { PedidoItem } from '../../pedido-item.model';
import { NotaRecepcion, NotaRecepcionEstado } from '../../nota-recepcion.model';
import { NotaRecepcionItem, NotaRecepcionItemEstado } from '../../nota-recepcion-item.model';
import { Presentacion } from '../../../../../productos/presentacion/presentacion.model';
import { PedidoService } from '../../../pedido.service';
import { PresentacionService } from '../../../../../productos/presentacion/presentacion.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../../shared/components/dialogos/dialogos.service';
import { dateToString } from '../../../../../../commons/core/utils/dateUtils';
import { debounceTime } from 'rxjs/operators';

export interface RechazarItemDialogData {
  pedidoItem: PedidoItem;
  notasDisponibles: NotaRecepcion[];
  pedidoId: number;
  notaPreseleccionada?: number; // ID de la nota preseleccionada (opcional)
  cantidadMaxima?: number; // Cantidad máxima que se puede rechazar (opcional)
  itemToReject?: NotaRecepcionItem; // Ítem específico a rechazar (para rechazo desde nota de recepción)
}

export interface RechazarItemDialogResult {
  success: boolean;
  notaRecepcionItem?: NotaRecepcionItem;
  message?: string;
}

export enum MotivoRechazo {
  VENCIDO = 'VENCIDO',
  AVERIADO = 'AVERIADO',
  FALTANTE = 'FALTANTE',
  OTRO = 'OTRO'
}

@UntilDestroy()
@Component({
  selector: 'app-rechazar-item-dialog',
  templateUrl: './rechazar-item-dialog.component.html',
  styleUrls: ['./rechazar-item-dialog.component.scss']
})
export class RechazarItemDialogComponent implements OnInit {
  @ViewChild('btnGuardar') btnGuardar!: MatButton;

  form!: FormGroup;
  isLoading = false;
  isInitializing = true;
  cantidadPendiente = 0;

  // Propiedades para presentaciones
  presentacionesDisponibles: Presentacion[] = [];
  presentacionSeleccionada: Presentacion | null = null;

  // Propiedades para nota preseleccionada
  notaPreseleccionada: boolean = false;
  cantidadMaxima: number = 0;

  // Propiedades para el ítem a rechazar y sus distribuciones
  itemToReject: NotaRecepcionItem | null = null;
  distribucionesDelItem: any[] = [];
  tieneDistribuciones: boolean = false;

  // Propiedades computadas para evitar funciones en template
  productoDisplay = '';
  notasDisponiblesDisplay: any[] = [];
  motivosRechazoDisplay: any[] = [];
  cantidadEnUnidadesBaseComputed = 0;

  // Enums para template
  MotivoRechazo = MotivoRechazo;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RechazarItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RechazarItemDialogData,
    private pedidoService: PedidoService,
    private presentacionService: PresentacionService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService
  ) {
    this.cantidadPendiente = this.data.pedidoItem.cantidadPendiente || 0;
    this.notaPreseleccionada = !!this.data.notaPreseleccionada;
    this.cantidadMaxima = this.data.cantidadMaxima || 0;
    this.itemToReject = this.data.itemToReject || null;
    this.initializeForm();
    this.initializeDisplayProperties();
  }

  ngOnInit(): void {
    this.loadPresentaciones();
    this.setupFormListeners();
    
    // Si hay un ítem específico a rechazar, cargar sus distribuciones
    if (this.itemToReject) {
      this.cargarDistribucionesDelItem();
    }
    
    this.isInitializing = false;
  }

  private initializeForm(): void {
    // Determinar la cantidad total a rechazar (en unidades base)
    let cantidadTotalEnUnidadesBase = 0;
    
    if (this.itemToReject) {
      // Si hay un ítem específico, usar su cantidad total en unidades base
      cantidadTotalEnUnidadesBase = this.itemToReject.cantidadEnNota || 0;
    } else if (this.notaPreseleccionada) {
      // Si hay nota preseleccionada, usar la cantidad máxima especificada
      cantidadTotalEnUnidadesBase = this.cantidadMaxima;
    } else {
      // Caso normal: usar la cantidad pendiente del pedido
      cantidadTotalEnUnidadesBase = this.cantidadPendiente;
    }
    
    this.form = this.fb.group({
      notaRecepcionId: [this.data.notaPreseleccionada || null, Validators.required],
      presentacionId: [null, Validators.required],
      cantidadRechazada: [null, [Validators.required, Validators.min(0.01)]], // Se actualizará después
      motivoRechazo: [null, Validators.required],
      observaciones: [''] // Removida validación de required y minLength
    });

    // Guardar la cantidad en unidades base para usarla después
    this.cantidadEnUnidadesBaseComputed = cantidadTotalEnUnidadesBase;
  }

  private initializeDisplayProperties(): void {
    this.productoDisplay = this.data.pedidoItem.producto?.descripcion || 'Producto no disponible';
    
    if (this.notaPreseleccionada) {
      // Si hay nota preseleccionada, solo mostrar esa nota
      this.notasDisponiblesDisplay = this.data.notasDisponibles.map(nota => ({
        value: nota.id,
        viewValue: `Número: ${nota.numero} - Fecha: ${dateToString(nota.fecha, 'dd/MM/yyyy')}`
      }));
    } else {
      // Si no hay nota preseleccionada, mostrar todas las opciones
      this.notasDisponiblesDisplay = this.data.notasDisponibles.map(nota => ({
        value: nota.id,
        viewValue: `Número: ${nota.numero} - Fecha: ${dateToString(nota.fecha, 'dd/MM/yyyy')}`
      }));
      
      // Agregar opción para crear nueva nota
      this.notasDisponiblesDisplay.push({
        value: 0,
        viewValue: '➕ Crear Nueva Nota'
      });

      // Agregar opción para crear nota de rechazo especial
      this.notasDisponiblesDisplay.push({
        value: -1,
        viewValue: '🚫 Crear Nota de Rechazo (Producto no entregado)'
      });
    }

    this.motivosRechazoDisplay = [
      { value: MotivoRechazo.VENCIDO, viewValue: 'Vencido' },
      { value: MotivoRechazo.AVERIADO, viewValue: 'Averiado' },
      { value: MotivoRechazo.FALTANTE, viewValue: 'Faltante' },
      { value: MotivoRechazo.OTRO, viewValue: 'Otro' }
    ];
  }

  private loadPresentaciones(): void {
    if (this.data.pedidoItem.producto?.id) {
      this.presentacionService.onGetPresentacionesPorProductoId(this.data.pedidoItem.producto.id)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (presentaciones) => {
            this.presentacionesDisponibles = presentaciones;
            
            // Seleccionar por defecto la presentación del pedido item
            if (this.data.pedidoItem.presentacionCreacion) {
              this.presentacionSeleccionada = presentaciones.find(p => p.id === this.data.pedidoItem.presentacionCreacion.id) || presentaciones[0];
            } else {
              this.presentacionSeleccionada = presentaciones[0];
            }
            
            // Calcular la cantidad por presentación
            let cantidadPorPresentacion = 0;
            if (this.presentacionSeleccionada && this.presentacionSeleccionada.cantidad > 0) {
              cantidadPorPresentacion = this.cantidadEnUnidadesBaseComputed / this.presentacionSeleccionada.cantidad;
            } else {
              cantidadPorPresentacion = this.cantidadEnUnidadesBaseComputed;
            }
            
            // Actualizar el formulario con la presentación seleccionada y la cantidad calculada
            this.form.patchValue({
              presentacionId: this.presentacionSeleccionada?.id,
              cantidadRechazada: cantidadPorPresentacion
            });
            
            // Actualizar la validación máxima
            this.form.get('cantidadRechazada')?.setValidators([
              Validators.required, 
              Validators.min(0.01), 
              Validators.max(cantidadPorPresentacion)
            ]);
            this.form.get('cantidadRechazada')?.updateValueAndValidity();
            
            this.updateComputedProperties();
          },
          error: (error) => {
            console.error('Error cargando presentaciones:', error);
            this.notificacionService.openAlgoSalioMal('Error cargando presentaciones');
          }
        });
    }
  }

  private setupFormListeners(): void {
    // Configurar navegación por teclado
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        debounceTime(100)
      )
      .subscribe(() => {
        this.updateComputedProperties();
      });

    // Listener específico para cambios en presentación
    this.form.get('presentacionId')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((presentacionId) => {
        if (presentacionId && this.hasItemToReject) {
          // Si hay un ítem específico y cambia la presentación, recalcular cantidad
          const presentacion = this.presentacionesDisponibles.find(p => p.id === presentacionId);
          if (presentacion && presentacion.cantidad > 0) {
            const cantidadPorPresentacion = this.cantidadEnUnidadesBaseComputed / presentacion.cantidad;
            this.form.patchValue({
              cantidadRechazada: cantidadPorPresentacion
            }, { emitEvent: false });
            
            // Actualizar validación máxima
            this.form.get('cantidadRechazada')?.setValidators([
              Validators.required, 
              Validators.min(0.01), 
              Validators.max(cantidadPorPresentacion)
            ]);
            this.form.get('cantidadRechazada')?.updateValueAndValidity();
          }
        }
      });
  }

  private updateComputedProperties(): void {
    const formValue = this.form.value;
    
    // Actualizar presentación seleccionada
    if (formValue.presentacionId) {
      this.presentacionSeleccionada = this.presentacionesDisponibles.find(p => p.id === formValue.presentacionId) || null;
    }
    
    // Calcular cantidad en unidades base
    const cantidadRechazada = formValue.cantidadRechazada || 0;
    const presentacion = this.presentacionSeleccionada;
    
    if (presentacion && presentacion.cantidad > 0) {
      this.cantidadEnUnidadesBaseComputed = cantidadRechazada * presentacion.cantidad;
    } else {
      this.cantidadEnUnidadesBaseComputed = cantidadRechazada;
    }
  }

  get canSave(): boolean {
    return this.form.valid && !this.isLoading;
  }

  get hasItemToReject(): boolean {
    return !!this.itemToReject;
  }

  onGuardar(): void {
    if (!this.canSave) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.form.value;
    
    // Verificar si hay distribuciones que serán afectadas
    if (this.tieneDistribuciones) {
      this.dialogosService.confirm(
        'Rechazar Ítem con Distribuciones',
        `Este ítem tiene ${this.distribucionesDelItem.length} distribución(es) activa(s). 
         Al rechazar el ítem, todas las distribuciones serán automáticamente rechazadas.
         ¿Desea continuar?`
      ).subscribe(confirmed => {
        if (confirmed) {
          this.procesarRechazoCompleto(formValue);
        }
      });
    } else {
      this.procesarRechazoCompleto(formValue);
    }
  }

  private procesarRechazoCompleto(formValue: any): void {
    this.isLoading = true;

    let notaRecepcionItem: NotaRecepcionItem;

    if (this.itemToReject) {
      // Si hay un ítem específico a rechazar, actualizar el ítem existente
      notaRecepcionItem = Object.assign(new NotaRecepcionItem(), this.itemToReject);
      notaRecepcionItem.estado = NotaRecepcionItemEstado.RECHAZADO;
      notaRecepcionItem.motivoRechazo = formValue.motivoRechazo;
      notaRecepcionItem.observacion = formValue.observaciones;
    } else {
      // Crear nuevo NotaRecepcionItem con estado RECHAZADO
      notaRecepcionItem = new NotaRecepcionItem();
      notaRecepcionItem.notaRecepcion = this.data.notasDisponibles.find(n => n.id === formValue.notaRecepcionId) || new NotaRecepcion();
      notaRecepcionItem.pedidoItem = this.data.pedidoItem;
      notaRecepcionItem.producto = this.data.pedidoItem.producto;
      notaRecepcionItem.presentacionEnNota = this.presentacionSeleccionada;
      notaRecepcionItem.cantidadEnNota = this.cantidadEnUnidadesBaseComputed; // Usar cantidad en unidades base
      notaRecepcionItem.precioUnitarioEnNota = this.data.pedidoItem.precioUnitarioSolicitado || 0;
      notaRecepcionItem.esBonificacion = false;
      notaRecepcionItem.vencimientoEnNota = this.data.pedidoItem.vencimientoEsperado;
      notaRecepcionItem.observacion = formValue.observaciones;
      notaRecepcionItem.estado = NotaRecepcionItemEstado.RECHAZADO;
      notaRecepcionItem.motivoRechazo = formValue.motivoRechazo;
    }

    // Si hay nota preseleccionada, solo guardar el ítem
    if (this.notaPreseleccionada) {
      this.guardarItemYRechazarDistribuciones(notaRecepcionItem);
    } else {
      // Si se seleccionó crear nueva nota, primero crear la nota
      if (formValue.notaRecepcionId === 0) {
        this.crearNuevaNotaYGuardarItem(notaRecepcionItem, false);
      } else if (formValue.notaRecepcionId === -1) {
        // Crear nota de rechazo especial para productos no entregados
        this.crearNuevaNotaYGuardarItem(notaRecepcionItem, true);
      } else {
        this.guardarItemYRechazarDistribuciones(notaRecepcionItem);
      }
    }
  }

  private crearNuevaNotaYGuardarItem(notaRecepcionItem: NotaRecepcionItem, esNotaRechazo: boolean = false): void {
    // Crear nueva nota de recepción
    const nuevaNota = new NotaRecepcion();
    nuevaNota.pedido = this.data.pedidoItem.pedido;
    nuevaNota.numero = esNotaRechazo ? this.generarNumeroNotaRechazo() : this.generarNumeroNota();
    nuevaNota.fecha = new Date();
    
    // Asegurar que la moneda no sea null - usar moneda del pedido o una por defecto
    if (this.data.pedidoItem.pedido?.moneda) {
      nuevaNota.moneda = this.data.pedidoItem.pedido.moneda;
    } else {
      // Si no hay moneda en el pedido, usar una moneda por defecto (Guaraní)
      nuevaNota.moneda = { id: 1, denominacion: 'Guaraní', cambio: 1 } as any;
    }
    
    nuevaNota.cotizacion = 1; // Valor por defecto
    nuevaNota.estado = NotaRecepcionEstado.PENDIENTE_CONCILIACION;
    nuevaNota.esNotaRechazo = esNotaRechazo;
    
    // Para notas de rechazo, el tipoBoleta puede quedar null o usar un valor genérico
    // ya que el campo esNotaRechazo es suficiente para identificarlas

    this.pedidoService.onSaveNotaRecepcion(nuevaNota.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (notaCreada) => {
          notaRecepcionItem.notaRecepcion = notaCreada;
          this.guardarItemYRechazarDistribuciones(notaRecepcionItem);
        },
        error: (error) => {
          console.error('Error al crear nota:', error);
          this.notificacionService.openAlgoSalioMal('Error al crear la nota de recepción');
          this.isLoading = false;
        }
      });
  }

  private guardarItemYRechazarDistribuciones(notaRecepcionItem: NotaRecepcionItem): void {
    // Primero guardar el ítem rechazado
    this.pedidoService.onSaveNotaRecepcionItem(notaRecepcionItem.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (itemGuardado) => {
          // Si hay distribuciones, rechazarlas automáticamente
          if (this.tieneDistribuciones) {
            // Usar el ID del ítem original si estamos actualizando, o el nuevo ID si es un ítem nuevo
            const itemId = this.itemToReject?.id || itemGuardado.id;
            this.rechazarDistribucionesDelItem(itemId);
          } else {
            this.finalizarRechazo(itemGuardado);
          }
        },
        error: (error) => {
          console.error('Error al guardar ítem rechazado:', error);
          this.notificacionService.openAlgoSalioMal('Error al rechazar el ítem');
          this.isLoading = false;
        }
      });
  }

  private rechazarDistribucionesDelItem(itemId: number): void {
    // Rechazar todas las distribuciones del ítem
    const promesasRechazo = this.distribucionesDelItem.map(distribucion => {
      distribucion.estado = 'RECHAZADO';
      distribucion.fechaRechazo = new Date();
      distribucion.motivoRechazo = 'ITEM_RECHAZADO';
      distribucion.observacion = 'Rechazado automáticamente al rechazar el ítem';
      
      return this.pedidoService.onSaveNotaRecepcionItemDistribucion(distribucion.toInput()).toPromise();
    });

    Promise.all(promesasRechazo)
      .then(() => {
        console.log(`${this.distribucionesDelItem.length} distribuciones rechazadas automáticamente`);
        this.finalizarRechazo(null);
      })
      .catch(error => {
        console.error('Error al rechazar distribuciones:', error);
        this.notificacionService.openWarn('Ítem rechazado pero hubo errores al rechazar las distribuciones');
        this.finalizarRechazo(null);
      });
  }

  private finalizarRechazo(itemGuardado: any): void {
    this.isLoading = false;
    
    const mensaje = this.tieneDistribuciones 
      ? `Ítem rechazado exitosamente. ${this.distribucionesDelItem.length} distribución(es) rechazada(s) automáticamente.`
      : `Ítem rechazado exitosamente. Cantidad rechazada: ${this.cantidadEnUnidadesBaseComputed} unidades base`;
    
    const result: RechazarItemDialogResult = {
      success: true,
      notaRecepcionItem: itemGuardado,
      message: mensaje
    };
    
    this.dialogRef.close(result);
  }

  private generarNumeroNota(): number {
    // Generar número único para la nota
    const notasExistentes = this.data.notasDisponibles;
    const maxNumero = Math.max(...notasExistentes.map(n => n.numero || 0), 0);
    return maxNumero + 1;
  }

  private generarNumeroNotaRechazo(): number {
    // Generar número único para nota de rechazo usando el campo esNotaRechazo
    const notasExistentes = this.data.notasDisponibles;
    const notasRechazo = notasExistentes.filter(n => n.esNotaRechazo === true);
    const maxNumero = Math.max(...notasRechazo.map(n => n.numero || 0), 0);
    return maxNumero + 1;
  }

  onCancelar(): void {
    this.dialogRef.close({ success: false });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  // Navegación por teclado
  onNotaRecepcionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const presentacionSelect = document.querySelector('mat-select[formControlName="presentacionId"]') as HTMLElement;
      if (presentacionSelect) {
        presentacionSelect.click();
      }
    }
  }

  onPresentacionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const cantidadInput = document.querySelector('input[formControlName="cantidadRechazada"]') as HTMLInputElement;
      if (cantidadInput) {
        cantidadInput.focus();
      }
    }
  }

  onCantidadKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const motivoSelect = document.querySelector('mat-select[formControlName="motivoRechazo"]') as HTMLElement;
      if (motivoSelect) {
        motivoSelect.click();
      }
    }
  }

  onMotivoKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const observacionesTextarea = document.querySelector('textarea[formControlName="observaciones"]') as HTMLTextAreaElement;
      if (observacionesTextarea) {
        observacionesTextarea.focus();
      }
    }
  }

  onObservacionesKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.canSave) {
        this.onGuardar();
      }
    }
  }

  onMotivoSelectionChange(): void {
    // Después de seleccionar motivo, enfocar observaciones
    setTimeout(() => {
      const observacionesTextarea = document.querySelector('textarea[formControlName="observaciones"]') as HTMLTextAreaElement;
      if (observacionesTextarea) {
        observacionesTextarea.focus();
      }
    }, 100);
  }

  private cargarDistribucionesDelItem(): void {
    if (this.itemToReject?.id) {
      this.pedidoService.onGetNotaRecepcionItemDistribucionesByNotaRecepcionItemId(this.itemToReject.id)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (distribuciones) => {
            this.distribucionesDelItem = distribuciones;
            this.tieneDistribuciones = distribuciones.length > 0;
            
            // Mostrar información sobre distribuciones si las hay
            if (this.tieneDistribuciones) {
              this.mostrarInfoDistribuciones();
            }
          },
          error: (error) => {
            console.error('Error al cargar distribuciones del ítem:', error);
            this.distribucionesDelItem = [];
            this.tieneDistribuciones = false;
          }
        });
    }
  }

  private mostrarInfoDistribuciones(): void {
    const distribucionesInfo = this.distribucionesDelItem.map(d => 
      `${d.sucursal?.nombre || 'Sucursal'}: ${d.cantidadDistribuida || 0} unidades`
    ).join('\n');
    
    this.notificacionService.openWarn(
      `Este ítem tiene ${this.distribucionesDelItem.length} distribución(es) activa(s):\n${distribucionesInfo}\n\nTodas serán rechazadas automáticamente al rechazar el ítem.`
    );
  }
} 