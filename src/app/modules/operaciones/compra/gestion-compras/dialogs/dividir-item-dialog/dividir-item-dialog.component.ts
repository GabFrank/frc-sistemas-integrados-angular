import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PedidoItem } from '../../pedido-item.model';
import { NotaRecepcion } from '../../nota-recepcion.model';
import { NotaRecepcionItem, NotaRecepcionItemEstado } from '../../nota-recepcion-item.model';
import { Presentacion } from '../../../../../productos/presentacion/presentacion.model';
import { PedidoService } from '../../../pedido.service';
import { PresentacionService } from '../../../../../productos/presentacion/presentacion.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../../shared/components/dialogos/dialogos.service';
import { dateToString } from '../../../../../../commons/core/utils/dateUtils';

export interface DividirItemDialogData {
  pedidoItem: PedidoItem;
  notaRecepcion?: NotaRecepcion;
  notasDisponibles: NotaRecepcion[];
  pedidoId: number;
}

export interface DividirItemDialogResult {
  success: boolean;
  notaRecepcionItems?: NotaRecepcionItem[];
  message?: string;
}

@UntilDestroy()
@Component({
  selector: 'app-dividir-item-dialog',
  templateUrl: './dividir-item-dialog.component.html',
  styleUrls: ['./dividir-item-dialog.component.scss']
})
export class DividirItemDialogComponent implements OnInit {
  @ViewChild('btnGuardar') btnGuardar!: MatButton;

  form!: FormGroup;
  isLoading = false;
  isInitializing = true;
  presentaciones: Presentacion[] = [];
  presentacionSeleccionada: Presentacion | null = null;
  cantidadTotal = 0;
  cantidadAsignada = 0;
  cantidadPendiente = 0;

  // Propiedades computadas para evitar funciones en template
  cantidadAsignadaDisplay = 0;
  cantidadPendienteDisplay = 0;
  productoDisplay = '';
  notasDisponiblesDisplay: any[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DividirItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DividirItemDialogData,
    private pedidoService: PedidoService,
    private presentacionService: PresentacionService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService
  ) {
    this.cantidadTotal = this.data.pedidoItem.cantidadSolicitada || 0;
    this.initializeForm();
    this.initializeDisplayProperties();
  }

  ngOnInit(): void {
    this.loadPresentaciones();
    this.setupFormListeners();
    this.isInitializing = false;
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      presentacionId: [null, Validators.required],
      items: this.fb.array([])
    });

    // Agregar 2 items iniciales
    this.addItem();
    this.addItem();
  }

  private initializeDisplayProperties(): void {
    this.productoDisplay = this.data.pedidoItem.producto?.descripcion || 'Producto no disponible';
    
    this.notasDisponiblesDisplay = this.data.notasDisponibles.map(nota => ({
      value: nota.id,
      viewValue: `Número: ${nota.numero} - Fecha: ${dateToString(nota.fecha, 'dd/MM/yyyy')}`
    }));
    
    // Agregar opción para crear nueva nota
    this.notasDisponiblesDisplay.push({
      value: 0,
      viewValue: '➕ Crear Nueva Nota'
    });
  }

  private setupFormListeners(): void {
    // Listener para cambios de presentación
    this.form.get('presentacionId')?.valueChanges.pipe(
      untilDestroyed(this)
    ).subscribe((presentacionId) => {
      this.presentacionSeleccionada = this.presentaciones.find(p => p.id === presentacionId) || null;
      this.updateComputedProperties();
    });

    // Listener para cambios en los items
    this.items.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      untilDestroyed(this)
    ).subscribe(() => {
      this.updateComputedProperties();
    });
  }

  private loadPresentaciones(): void {
    if (this.data.pedidoItem.producto?.id) {
      this.presentacionService.onGetPresentacionesPorProductoId(this.data.pedidoItem.producto.id)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (presentaciones) => {
            this.presentaciones = presentaciones;
          },
          error: (error) => {
            console.error('Error cargando presentaciones:', error);
            this.notificacionService.openAlgoSalioMal('Error cargando presentaciones');
          }
        });
    }
  }

  private updateComputedProperties(): void {
    this.cantidadAsignada = 0;
    
    this.items.controls.forEach(control => {
      const cantidad = control.get('cantidad')?.value || 0;
      this.cantidadAsignada += cantidad;
    });
    
    // Convertir a unidad base para comparación
    const cantidadAsignadaEnUnidadBase = this.cantidadAsignada * (this.presentacionSeleccionada?.cantidad || 1);
    const cantidadTotalEnUnidadBase = this.cantidadTotal;
    
    this.cantidadPendiente = cantidadTotalEnUnidadBase - cantidadAsignadaEnUnidadBase;
    
    // Para display, mostrar en unidades de la presentación seleccionada
    this.cantidadAsignadaDisplay = this.cantidadAsignada;
    this.cantidadPendienteDisplay = this.cantidadPendiente / (this.presentacionSeleccionada?.cantidad || 1);
  }

  // Getters para el template
  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  get canAddMoreItems(): boolean {
    return this.cantidadPendiente > 0;
  }

  get canSave(): boolean {
    return this.form.valid && this.cantidadAsignada > 0;
  }

  get isOverQuantity(): boolean {
    const cantidadAsignadaEnUnidadBase = this.cantidadAsignada * (this.presentacionSeleccionada?.cantidad || 1);
    return cantidadAsignadaEnUnidadBase > this.cantidadTotal;
  }

  // Método helper para el template
  getItemForm(index: number): FormGroup {
    return this.items.at(index) as FormGroup;
  }

  // Método para generar array de índices
  get itemsIndices(): number[] {
    return Array.from({ length: this.items.length }, (_, i) => i);
  }

  // Métodos para manejar items dinámicos
  addItem(): void {
    const itemForm = this.fb.group({
      cantidad: [0, [Validators.required, Validators.min(1)]],
      notaRecepcionId: [null, Validators.required]
    });

    this.items.push(itemForm);
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  onGuardar(): void {
    if (!this.canSave) {
      this.notificacionService.openAlgoSalioMal('Por favor complete todos los campos requeridos');
      return;
    }

    // Verificar si excede la cantidad total
    if (this.isOverQuantity) {
      this.confirmarExcesoCantidad();
      return;
    }

    this.guardarItems();
  }

  private confirmarExcesoCantidad(): void {
    const cantidadAsignadaEnUnidadBase = this.cantidadAsignada * (this.presentacionSeleccionada?.cantidad || 1);
    const mensaje = `La cantidad total asignada (${this.cantidadAsignada} ${this.presentacionSeleccionada?.descripcion} = ${cantidadAsignadaEnUnidadBase} unidades) excede la cantidad solicitada (${this.cantidadTotal} unidades). ¿Desea continuar?`;
    
    this.dialogosService.confirm(mensaje, 'Confirmar Exceso de Cantidad')
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (confirmado) {
          this.guardarItems();
        }
      });
  }

  private guardarItems(): void {
    this.isLoading = true;
    const formValue = this.form.value;
    const notaRecepcionItems: NotaRecepcionItem[] = [];

    // Crear NotaRecepcionItem para cada item del formulario
    formValue.items.forEach((item: any) => {
      if (item.cantidad > 0 && item.notaRecepcionId) {
        const notaRecepcionItem = new NotaRecepcionItem();
        notaRecepcionItem.id = 0;
        notaRecepcionItem.notaRecepcion = { id: item.notaRecepcionId } as any;
        notaRecepcionItem.pedidoItem = this.data.pedidoItem;
        notaRecepcionItem.producto = this.data.pedidoItem.producto;
        
        // Convertir cantidad a unidad base según la presentación seleccionada
        const cantidadEnUnidadBase = item.cantidad * (this.presentacionSeleccionada?.cantidad || 1);
        notaRecepcionItem.cantidadEnNota = cantidadEnUnidadBase;
        
        notaRecepcionItem.precioUnitarioEnNota = this.data.pedidoItem.precioUnitarioSolicitado || 0;
        notaRecepcionItem.presentacionEnNota = this.presentacionSeleccionada;
        notaRecepcionItem.vencimientoEnNota = this.data.pedidoItem.vencimientoEsperado;
        notaRecepcionItem.esBonificacion = false;
        notaRecepcionItem.observacion = '';
        notaRecepcionItem.estado = NotaRecepcionItemEstado.CONCILIADO;
        notaRecepcionItem.motivoRechazo = null;

        notaRecepcionItems.push(notaRecepcionItem);
      }
    });

    // Guardar todos los items
    this.guardarItemsSecuencialmente(notaRecepcionItems, 0);
  }

  private guardarItemsSecuencialmente(items: NotaRecepcionItem[], index: number): void {
    if (index >= items.length) {
      // Todos los items guardados exitosamente
      this.isLoading = false;
      this.notificacionService.openSucess('Ítem dividido exitosamente');
      
      const dialogResult: DividirItemDialogResult = {
        success: true,
        notaRecepcionItems: items,
        message: 'Ítem dividido exitosamente'
      };
      
      this.dialogRef.close(dialogResult);
      return;
    }

    const item = items[index];
    const itemInput = item.toInput(); // Usar el método toInput() para convertir a formato correcto
    
    this.pedidoService.onSaveNotaRecepcionItem(itemInput)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (result) => {
          items[index] = result; // Actualizar con el resultado del servidor
          this.guardarItemsSecuencialmente(items, index + 1);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error guardando ítem:', error);
          this.notificacionService.openAlgoSalioMal('Error al dividir el ítem');
        }
      });
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
} 