import { Component, Inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

import { NotaRecepcion, NotaRecepcionEstado, TipoBoleta } from '../../nota-recepcion.model';
import { NotaRecepcionItem, NotaRecepcionItemEstado } from '../../nota-recepcion-item.model';
import { Pedido } from '../../pedido.model';
import { Moneda } from '../../moneda.model';

export interface AddEditNotaRecepcionDialogData {
  nota?: NotaRecepcion;
  pedido?: Pedido;
  isEdit: boolean;
}

@Component({
  selector: 'app-add-edit-nota-recepcion-dialog',
  templateUrl: './add-edit-nota-recepcion-dialog.component.html',
  styleUrls: ['./add-edit-nota-recepcion-dialog.component.scss']
})
export class AddEditNotaRecepcionDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('guardarButton', { static: false }) guardarButton!: MatButton;
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  notaRecepcionForm: FormGroup;
  dialogTitle: string;
  actionButtonText: string;
  tipoBoletaList = Object.values(TipoBoleta);
  estadosDisponibles = Object.values(NotaRecepcionEstado);
  NotaRecepcionEstado = NotaRecepcionEstado;

  // Datos mock - en producción vendrían del servicio
  monedas: Moneda[] = [];

  // Propiedades para la tabla de ítems
  itemsDataSource = new MatTableDataSource<NotaRecepcionItem>([]);
  displayedColumns: string[] = ['producto', 'cantidad', 'precio', 'subtotal', 'estado', 'acciones'];

  // PROPIEDADES COMPUTADAS - NO usar funciones en templates
  // Error states para cada campo
  tipoBoletaRequiredError: boolean = false;
  tipoBoletaMaxLengthError: boolean = false;
  tipoBoletaErrorMessage: string = '';
  
  numeroRequiredError: boolean = false;
  numeroErrorMessage: string = '';
  
  fechaRequiredError: boolean = false;
  fechaErrorMessage: string = '';
  
  monedaRequiredError: boolean = false;
  monedaErrorMessage: string = '';
  
  cotizacionRequiredError: boolean = false;
  cotizacionMinError: boolean = false;
  cotizacionErrorMessage: string = '';

  // Propiedades computadas para el card informativo
  totalItemsComputed: number = 0;
  montoTotalComputed: number = 0;
  estadoDisplayName: string = '';
  estadoChipClass: string = '';
  pagadoDisplayText: string = '';
  pagadoChipClass: string = '';

  // Propiedades computadas para items (se actualizan cuando cambia itemsDataSource)
  computedItemsData: any[] = [];

  // Bandera para saber si ya se creó la nota
  private notaCreada: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddEditNotaRecepcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddEditNotaRecepcionDialogData,
    private formBuilder: FormBuilder
  ) {
    this.dialogTitle = data.isEdit ? 'Editar Nota de Recepción' : 'Nueva Nota de Recepción';
    this.actionButtonText = data.isEdit ? 'Actualizar' : 'Crear';
    this.initializeMockData();
    this.notaCreada = false;
  }

  private initializeMockData(): void {
    // Crear monedas mock
    const usd = new Moneda();
    usd.id = 1;
    usd.nombre = 'USD';
    usd.simbolo = '$';

    const pyg = new Moneda();
    pyg.id = 2;
    pyg.nombre = 'PYG';
    pyg.simbolo = 'Gs.';

    const eur = new Moneda();
    eur.id = 3;
    eur.nombre = 'EUR';
    eur.simbolo = '€';

    this.monedas = [usd, pyg, eur];
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupKeyboardNavigation();
    this.loadItems();
    this.updateComputedProperties();
  }

  ngAfterViewInit(): void {
    // Configurar paginador si está disponible
    if (this.paginator) {
      this.itemsDataSource.paginator = this.paginator;
    }
  }

  private initializeForm(): void {
    this.notaRecepcionForm = this.formBuilder.group({
      numero: [
        this.data.nota?.numero || '', 
        [Validators.required]
      ],
      timbrado: [
        this.data.nota?.timbrado || ''
      ],
      tipoBoleta: [
        this.data.nota?.tipoBoleta || TipoBoleta.FACTURA,
        [Validators.required]
      ],
      fecha: [
        this.data.nota?.fecha || new Date(),
        [Validators.required]
      ],
      moneda: [
        this.data.nota?.moneda || this.monedas[0],
        [Validators.required]
      ],
      cotizacion: [
        this.data.nota?.cotizacion || 1,
        [Validators.required, Validators.min(0)]
      ],
      estado: [
        this.data.nota?.estado || NotaRecepcionEstado.PENDIENTE_CONCILIACION
      ],
      pagado: [
        this.data.nota?.pagado || false
      ]
    });

    // Suscribirse a cambios para actualizar propiedades computadas
    this.notaRecepcionForm.valueChanges.subscribe(() => {
      this.updateComputedProperties();
    });
  }

  private loadItems(): void {
    // Siempre mostrar el panel de ítems, incluso si no hay ítems
    // En modo edición, cargar ítems reales; en modo creación, mostrar lista vacía
    if (this.data.isEdit && this.data.nota) {
      // En producción, cargar los ítems desde el servicio
      // Por ahora, datos mock para mostrar funcionalidad
      const item1 = new NotaRecepcionItem();
      item1.id = 1;
      item1.notaRecepcion = this.data.nota;
      item1.pedidoItem = null;
      item1.cantidadEnNota = 10;
      item1.precioUnitarioEnNota = 15.50;
      item1.esBonificacion = false;
      item1.vencimientoEnNota = new Date();
      item1.estado = NotaRecepcionItemEstado.CONCILIADO;
      item1.motivoRechazo = null;

      const item2 = new NotaRecepcionItem();
      item2.id = 2;
      item2.notaRecepcion = this.data.nota;
      item2.pedidoItem = null;
      item2.cantidadEnNota = 5;
      item2.precioUnitarioEnNota = 25.00;
      item2.esBonificacion = false;
      item2.vencimientoEnNota = new Date();
      item2.estado = NotaRecepcionItemEstado.CONCILIADO;
      item2.motivoRechazo = null;

      const item3 = new NotaRecepcionItem();
      item3.id = 3;
      item3.notaRecepcion = this.data.nota;
      item3.pedidoItem = null;
      item3.cantidadEnNota = 8;
      item3.precioUnitarioEnNota = 12.75;
      item3.esBonificacion = false;
      item3.vencimientoEnNota = new Date();
      item3.estado = NotaRecepcionItemEstado.CONCILIADO;
      item3.motivoRechazo = null;

      const mockItems: NotaRecepcionItem[] = [item1, item2, item3];
      this.itemsDataSource.data = mockItems;
    } else {
      // En modo creación, mostrar lista vacía
      this.itemsDataSource.data = [];
    }
    
    // Configurar paginador después de que se inicialice
    this.updateComputedProperties();
  }

  private setupKeyboardNavigation(): void {
    // Navegación con Enter key solamente
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const activeElement = document.activeElement as HTMLElement;
        const formControlName = activeElement?.getAttribute('formControlName');
        
        if (formControlName) {
          event.preventDefault();
          this.handleEnterNavigation(formControlName);
        }
      }
    });
  }

  private handleEnterNavigation(currentField: string): void {
    // Orden especificado por el usuario: tipo boleta → numero → timbrado → fecha → botón Crear
    const navigationMap: { [key: string]: string } = {
      'tipoBoleta': 'numero',
      'numero': 'timbrado',
      'timbrado': 'fecha',
      'fecha': 'guardarButton'
    };

    const nextField = navigationMap[currentField];
    
    // Validar campo actual antes de navegar
    const currentControl = this.notaRecepcionForm.get(currentField);
    if (currentControl && currentControl.valid) {
      if (nextField === 'guardarButton') {
        // Enfocar botón guardar
        setTimeout(() => {
          if (this.guardarButton) {
            this.guardarButton._elementRef.nativeElement.focus();
          }
        }, 100);
      } else {
        // Enfocar siguiente campo
        const nextElement = document.querySelector(`[formControlName="${nextField}"]`) as HTMLElement;
        if (nextElement) {
          nextElement.focus();
        }
      }
    } else {
      // Marcar campo como touched para mostrar errores
      currentControl?.markAsTouched();
      this.updateComputedProperties();
    }
  }

  updateComputedProperties(): void {
    // Actualizar error states
    this.updateErrorStates();
    
    // Actualizar propiedades del card informativo
    this.updateCardProperties();
    
    // Actualizar datos computados de items
    this.updateItemsComputedData();
  }

  private updateErrorStates(): void {
    const form = this.notaRecepcionForm;
    
    // TipoBoleta errors
    const tipoBoletaControl = form.get('tipoBoleta');
    this.tipoBoletaRequiredError = !!(tipoBoletaControl?.hasError('required') && tipoBoletaControl?.touched);
    this.tipoBoletaMaxLengthError = !!(tipoBoletaControl?.hasError('maxLength') && tipoBoletaControl?.touched);
    this.tipoBoletaErrorMessage = this.tipoBoletaRequiredError ? 'Este campo es requerido' : 
                                  this.tipoBoletaMaxLengthError ? 'El texto es demasiado largo' : '';

    // Numero errors
    const numeroControl = form.get('numero');
    this.numeroRequiredError = !!(numeroControl?.hasError('required') && numeroControl?.touched);
    this.numeroErrorMessage = this.numeroRequiredError ? 'Este campo es requerido' : '';

    // Fecha errors
    const fechaControl = form.get('fecha');
    this.fechaRequiredError = !!(fechaControl?.hasError('required') && fechaControl?.touched);
    this.fechaErrorMessage = this.fechaRequiredError ? 'Este campo es requerido' : '';

    // Moneda errors
    const monedaControl = form.get('moneda');
    this.monedaRequiredError = !!(monedaControl?.hasError('required') && monedaControl?.touched);
    this.monedaErrorMessage = this.monedaRequiredError ? 'Este campo es requerido' : '';

    // Cotizacion errors
    const cotizacionControl = form.get('cotizacion');
    this.cotizacionRequiredError = !!(cotizacionControl?.hasError('required') && cotizacionControl?.touched);
    this.cotizacionMinError = !!(cotizacionControl?.hasError('min') && cotizacionControl?.touched);
    this.cotizacionErrorMessage = this.cotizacionRequiredError ? 'Este campo es requerido' : 
                                  this.cotizacionMinError ? 'El valor debe ser mayor a 0' : '';
  }

  private updateCardProperties(): void {
    // Total items
    this.totalItemsComputed = this.itemsDataSource.data.length;
    
    // Monto total
    this.montoTotalComputed = this.itemsDataSource.data.reduce((total, item) => 
      total + (item.cantidadEnNota * item.precioUnitarioEnNota), 0);
    
    // Estado display name
    const estadoValue = this.notaRecepcionForm.get('estado')?.value;
    this.estadoDisplayName = this.getEstadoDisplayNameInternal(estadoValue);
    this.estadoChipClass = this.getEstadoChipClassInternal(estadoValue);
    
    // Pagado display
    const pagadoValue = this.notaRecepcionForm.get('pagado')?.value;
    this.pagadoDisplayText = pagadoValue ? 'Sí' : 'No';
    this.pagadoChipClass = pagadoValue ? 'true' : 'false';
  }

  private updateItemsComputedData(): void {
    this.computedItemsData = this.itemsDataSource.data.map(item => ({
      ...item,
      productoNombre: 'Producto Mock ' + item.id,
      cantidadDisplay: item.cantidadEnNota || 0,
      precioDisplay: item.precioUnitarioEnNota,
      subtotalDisplay: item.cantidadEnNota * item.precioUnitarioEnNota,
      estadoChipClass: this.getItemEstadoChipClassInternal(item.estado),
      estadoDisplayName: this.getItemEstadoDisplayNameInternal(item.estado)
    }));
  }

  // Métodos internos para computar valores (NO usar en templates)
  private getEstadoDisplayNameInternal(estado: NotaRecepcionEstado): string {
    switch (estado) {
      case NotaRecepcionEstado.PENDIENTE_CONCILIACION:
        return 'Pendiente Conciliación';
      case NotaRecepcionEstado.CONCILIADA:
        return 'Conciliada';
      case NotaRecepcionEstado.EN_RECEPCION:
        return 'En Recepción';
      case NotaRecepcionEstado.RECEPCION_PARCIAL:
        return 'Recepción Parcial';
      case NotaRecepcionEstado.RECEPCION_COMPLETA:
        return 'Recepción Completa';
      case NotaRecepcionEstado.CERRADA:
        return 'Cerrada';
      default:
        return estado || '';
    }
  }

  private getEstadoChipClassInternal(estado: NotaRecepcionEstado): string {
    switch (estado) {
      case NotaRecepcionEstado.PENDIENTE_CONCILIACION:
        return 'estado-pendiente';
      case NotaRecepcionEstado.CONCILIADA:
        return 'estado-activo';
      case NotaRecepcionEstado.EN_RECEPCION:
        return 'estado-activo';
      case NotaRecepcionEstado.RECEPCION_PARCIAL:
        return 'estado-pendiente';
      case NotaRecepcionEstado.RECEPCION_COMPLETA:
        return 'estado-activo';
      case NotaRecepcionEstado.CERRADA:
        return 'estado-cancelado';
      default:
        return 'estado-pendiente';
    }
  }

  private getItemEstadoChipClassInternal(estado: NotaRecepcionItemEstado): string {
    switch (estado) {
      case NotaRecepcionItemEstado.CONCILIADO:
        return 'estado-activo';
      case NotaRecepcionItemEstado.RECHAZADO:
        return 'estado-cancelado';
      default:
        return 'estado-pendiente';
    }
  }

  private getItemEstadoDisplayNameInternal(estado: NotaRecepcionItemEstado): string {
    switch (estado) {
      case NotaRecepcionItemEstado.CONCILIADO:
        return 'Conciliado';
      case NotaRecepcionItemEstado.RECHAZADO:
        return 'Rechazado';
      default:
        return estado || '';
    }
  }

  // Métodos para manejo de ítems
  onAddItem(): void {
    // TODO: Implementar diálogo para agregar ítem
    console.log('Agregar ítem');
  }

  onEditItem(item: NotaRecepcionItem): void {
    // TODO: Implementar diálogo para editar ítem
    console.log('Editar ítem', item);
  }

  onDeleteItem(item: NotaRecepcionItem): void {
    // TODO: Implementar confirmación y eliminación
    console.log('Eliminar ítem', item);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.notaRecepcionForm.valid) {
      const formValue = this.notaRecepcionForm.value;
      
      let nota: NotaRecepcion;
      
      if (this.data.isEdit && this.data.nota) {
        // Edit existing nota
        nota = Object.assign(new NotaRecepcion(), this.data.nota);
        
        // Update editable properties from form
        nota.numero = formValue.numero;
        nota.timbrado = formValue.timbrado;
        nota.tipoBoleta = formValue.tipoBoleta;
        nota.fecha = formValue.fecha;
        nota.moneda = formValue.moneda;
        nota.cotizacion = formValue.cotizacion;
        
        // En modo edición, cerrar diálogo normalmente
        this.dialogRef.close(nota);
      } else {
        // Create new nota
        nota = Object.assign(new NotaRecepcion(), {
          pedido: this.data.pedido!,
          creadoEn: new Date(),
          estado: NotaRecepcionEstado.PENDIENTE_CONCILIACION,
          pagado: false
        });
        
        // Update editable properties from form
        nota.numero = formValue.numero;
        nota.timbrado = formValue.timbrado;
        nota.tipoBoleta = formValue.tipoBoleta;
        nota.fecha = formValue.fecha;
        nota.moneda = formValue.moneda;
        nota.cotizacion = formValue.cotizacion;
        
        // En modo creación, no cerrar diálogo
        // Cambiar título y botón text
        this.dialogTitle = 'Editar Nota de Recepción';
        this.actionButtonText = 'Actualizar';
        this.notaCreada = true;
        
        // Simular que ahora tenemos la nota creada
        this.data.nota = nota;
        this.data.isEdit = true;
        
        // Cargar items (simulado)
        this.loadItemsAfterCreation();
        
        // Dar foco al botón Cancelar
        this.focusCancelButton();
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.notaRecepcionForm.controls).forEach(key => {
        this.notaRecepcionForm.get(key)?.markAsTouched();
      });
      this.updateComputedProperties();
    }
  }

  private loadItemsAfterCreation(): void {
    // Cargar items mock después de crear la nota
    const item1 = new NotaRecepcionItem();
    item1.id = 1;
    item1.notaRecepcion = this.data.nota!;
    item1.pedidoItem = null;
    item1.cantidadEnNota = 10;
    item1.precioUnitarioEnNota = 15.50;
    item1.esBonificacion = false;
    item1.vencimientoEnNota = new Date();
    item1.estado = NotaRecepcionItemEstado.CONCILIADO;
    item1.motivoRechazo = null;

    const item2 = new NotaRecepcionItem();
    item2.id = 2;
    item2.notaRecepcion = this.data.nota!;
    item2.pedidoItem = null;
    item2.cantidadEnNota = 5;
    item2.precioUnitarioEnNota = 25.00;
    item2.esBonificacion = false;
    item2.vencimientoEnNota = new Date();
    item2.estado = NotaRecepcionItemEstado.CONCILIADO;
    item2.motivoRechazo = null;

    const item3 = new NotaRecepcionItem();
    item3.id = 3;
    item3.notaRecepcion = this.data.nota!;
    item3.pedidoItem = null;
    item3.cantidadEnNota = 8;
    item3.precioUnitarioEnNota = 12.75;
    item3.esBonificacion = false;
    item3.vencimientoEnNota = new Date();
    item3.estado = NotaRecepcionItemEstado.CONCILIADO;
    item3.motivoRechazo = null;

    const mockItems: NotaRecepcionItem[] = [item1, item2, item3];
    this.itemsDataSource.data = mockItems;
    
    // Actualizar propiedades computadas
    this.updateComputedProperties();
  }

  private focusCancelButton(): void {
    // Dar foco al botón Cancelar después de crear
    setTimeout(() => {
      const cancelButton = document.querySelector('.cancel-button') as HTMLButtonElement;
      if (cancelButton) {
        cancelButton.focus();
      }
    }, 100);
  }
} 