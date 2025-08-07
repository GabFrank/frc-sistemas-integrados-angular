import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SolicitudPago, SolicitudPagoInput, SolicitudPagoEstado } from '../../solicitud-pago.model';
import { NotaRecepcion } from '../../nota-recepcion.model';
import { SolicitudPagoService } from '../../solicitud-pago.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { Pedido } from '../../pedido.model';
import { FormaPago } from '../../../../../financiero/forma-pago/forma-pago.model';
import { Moneda } from '../../../../../financiero/moneda/moneda.model';
import { FormaPagoService } from '../../../../../financiero/forma-pago/forma-pago.service';
import { MonedaService } from '../../../../../financiero/moneda/moneda.service';

@UntilDestroy()
@Component({
  selector: 'app-create-edit-solicitud-pago-compra-dialog',
  templateUrl: './create-edit-solicitud-pago-compra-dialog.component.html',
  styleUrls: ['./create-edit-solicitud-pago-compra-dialog.component.scss']
})
export class CreateEditSolicitudPagoCompraDialogComponent implements OnInit {
  
  // Dialog data
  pedido!: Pedido;
  solicitudPago?: SolicitudPago; // For editing mode
  isEditMode = false;

  // Enum references for template
  SolicitudPagoEstado = SolicitudPagoEstado;

  // Data arrays
  notasDisponibles: NotaRecepcion[] = [];
  notasSeleccionadas: NotaRecepcion[] = [];
  formasPago: FormaPago[] = [];
  monedas: Moneda[] = [];

  // Forms
  solicitudForm!: FormGroup;

  // UI State
  loading = false;
  loadingNotas = false;
  loadingFormasPago = false;
  loadingMonedas = false;

  // Computed properties
  notasDisponiblesComputed: NotaRecepcion[] = [];
  montoNotasSeleccionadasComputed = 0;
  canSaveComputed = false;
  fechaPagoCalculadaComputed: Date | null = null;
  
  // Table configuration
  displayedColumnsNotas: string[] = ['select', 'numero', 'fecha', 'monto', 'estado'];
  notasSeleccionadasIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateEditSolicitudPagoCompraDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      pedido?: Pedido;
      solicitudPago?: SolicitudPago;
    },
    private solicitudPagoService: SolicitudPagoService,
    private notificacionService: NotificacionSnackbarService,
    private formaPagoService: FormaPagoService,
    private monedaService: MonedaService
  ) {
    this.pedido = data.pedido || null;
    this.solicitudPago = data.solicitudPago;
    this.isEditMode = !!this.solicitudPago;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadNotasDisponibles();
    this.loadFormasPago();
    this.loadMonedas();
  }

  /**
   * Inicializa el formulario
   */
  private initForm(): void {
    // Calcular fecha de pago propuesta basada en plazo de crédito
    const fechaPagoPropuesta = this.calcularFechaPagoPropuesta();
    
    // Obtener valores por defecto del pedido si está disponible
    const plazoCredito = this.pedido?.plazoCredito || 0;
    const formaPagoId = this.pedido?.formaPago?.id || null;
    const monedaId = this.pedido?.moneda?.id || null;
    
    this.solicitudForm = this.fb.group({
      fechaPagoPropuesta: [''],
      observaciones: [''],
      formaPagoId: [{value: formaPagoId, disabled: this.loadingFormasPago}, Validators.required],
      monedaId: [{value: monedaId, disabled: this.loadingMonedas}, Validators.required],
      plazoDias: [plazoCredito]
    });

    // Las notas seleccionadas ahora se manejan mediante checkboxes
    // No necesitamos watch en FormControl

    // Watch changes in plazoDias to recalculate fecha
    this.solicitudForm.get('plazoDias')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.calcularFechaPagoPropuesta();
      });

    // If editing, populate form
    if (this.isEditMode && this.solicitudPago) {
      this.solicitudForm.patchValue({
        fechaPagoPropuesta: this.solicitudPago.fechaPagoPropuesta,
        observaciones: this.solicitudPago.observaciones,
        formaPagoId: this.solicitudPago.formaPago?.id,
        monedaId: this.solicitudPago.moneda?.id
      });
      
      // Cargar notas seleccionadas para edición
      this.notasSeleccionadasIds = this.solicitudPago.notasRecepcion?.map(n => n.id) || [];
    }

    // Calcular fecha inicial
    this.calcularFechaPagoPropuesta();
  }

  /**
   * Calcula la fecha de pago propuesta basada en el plazo de crédito
   */
  private calcularFechaPagoPropuesta(): Date {
    // Obtener plazo del formulario o del pedido
    const plazoDias = this.solicitudForm?.get('plazoDias')?.value || 
                      this.pedido?.plazoCredito || 0;
    const fechaActual = new Date();
    
    if (plazoDias > 0) {
      const fechaPago = new Date(fechaActual);
      fechaPago.setDate(fechaPago.getDate() + plazoDias);
      this.fechaPagoCalculadaComputed = fechaPago;
      
      // Actualizar el campo de fecha en el formulario
      if (this.solicitudForm) {
        this.solicitudForm.patchValue({
          fechaPagoPropuesta: fechaPago
        });
      }
      
      return fechaPago;
    } else {
      this.fechaPagoCalculadaComputed = fechaActual;
      
      // Actualizar el campo de fecha en el formulario
      if (this.solicitudForm) {
        this.solicitudForm.patchValue({
          fechaPagoPropuesta: fechaActual
        });
      }
      
      return fechaActual;
    }
  }

  /**
   * Carga las formas de pago disponibles
   */
  private loadFormasPago(): void {
    this.loadingFormasPago = true;
    // Disable form control while loading
    this.solicitudForm.get('formaPagoId')?.disable();
    
    this.formaPagoService.onGetAllFormaPago()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (formasPago) => {
          this.formasPago = formasPago;
          
          // Si no hay pedido o forma de pago seleccionada, usar la primera opción
          if (!this.pedido?.formaPago?.id && formasPago.length > 0 && !this.isEditMode) {
            this.solicitudForm.patchValue({
              formaPagoId: formasPago[0].id
            });
          }
          
          this.updateComputedProperties();
        },
        error: (error) => {
          console.error('Error al cargar formas de pago:', error);
          this.notificacionService.openAlgoSalioMal('Error al cargar formas de pago');
        },
        complete: () => {
          this.loadingFormasPago = false;
          // Enable form control after loading
          this.solicitudForm.get('formaPagoId')?.enable();
        }
      });
  }

  /**
   * Carga las monedas disponibles
   */
  private loadMonedas(): void {
    this.loadingMonedas = true;
    // Disable form control while loading
    this.solicitudForm.get('monedaId')?.disable();
    
    this.monedaService.onGetAll()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (monedas) => {
          this.monedas = monedas;
          
          // Si no hay pedido o moneda seleccionada, usar la primera opción
          if (!this.pedido?.moneda?.id && monedas.length > 0 && !this.isEditMode) {
            this.solicitudForm.patchValue({
              monedaId: monedas[0].id
            });
          }
          
          this.updateComputedProperties();
        },
        error: (error) => {
          console.error('Error al cargar monedas:', error);
          this.notificacionService.openAlgoSalioMal('Error al cargar monedas');
        },
        complete: () => {
          this.loadingMonedas = false;
          // Enable form control after loading
          this.solicitudForm.get('monedaId')?.enable();
        }
      });
  }

  /**
   * Carga las notas disponibles para el pedido
   */
  private loadNotasDisponibles(): void {
    this.loadingNotas = true;
    this.solicitudPagoService.onGetNotasDisponiblesParaPago(this.pedido.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (notas) => {
          this.notasDisponibles = notas;
          this.updateComputedProperties();
        },
        error: (error) => {
          console.error('Error al cargar notas disponibles:', error);
          this.notificacionService.openAlgoSalioMal('Error al cargar notas disponibles');
        },
        complete: () => {
          this.loadingNotas = false;
          this.updateComputedProperties();
        }
      });
  }

  /**
   * Actualiza todas las propiedades computadas
   */
  private updateComputedProperties(): void {
    // Process notas disponibles
    this.notasDisponiblesComputed = this.notasDisponibles;

    // Process selected notas usando el array de IDs
    this.notasSeleccionadas = this.notasDisponibles.filter(nota => 
      this.notasSeleccionadasIds.includes(nota.id)
    );
    
    this.montoNotasSeleccionadasComputed = this.notasSeleccionadas.reduce((total, nota) => 
      total + (nota.valorTotal || 0), 0
    );

    // Can save - form valid and has selected notas
    this.canSaveComputed = this.solicitudForm.valid && this.notasSeleccionadasIds.length > 0;
  }

  /**
   * Guarda la solicitud de pago
   */
  onSave(): void {
    if (this.solicitudForm.invalid) {
      this.solicitudForm.markAllAsTouched();
      return;
    }

    if (this.notasSeleccionadasIds.length === 0) {
      this.notificacionService.openWarn('Debe seleccionar al menos una nota de recepción');
      return;
    }

    this.loading = true;

    // Calcular fecha de pago propuesta
    const fechaPagoPropuesta = this.calcularFechaPagoPropuesta();

    // Prepare input
    const input: SolicitudPagoInput = {
      proveedorId: this.pedido?.proveedor?.id || this.notasSeleccionadas[0]?.pedido?.proveedor?.id,
      montoTotal: this.montoNotasSeleccionadasComputed,
      monedaId: this.solicitudForm.get('monedaId')?.value,
      formaPagoId: this.solicitudForm.get('formaPagoId')?.value,
      estado: SolicitudPagoEstado.PENDIENTE,
      fechaPagoPropuesta: fechaPagoPropuesta.toISOString().split('T')[0], // Convert to YYYY-MM-DD
      observaciones: this.solicitudForm.get('observaciones')?.value,
      notaRecepcionIds: this.notasSeleccionadasIds,
      usuarioId: undefined // El generic-crud.service.ts lo agregará automáticamente
    };

    console.log('Debug - Usuario actual:', this.solicitudPagoService['genericCrudService']['mainService']?.usuarioActual);
    console.log('Debug - Input antes de guardar:', input);

    this.solicitudPagoService.onSaveInput(input)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (solicitud) => {
          this.notificacionService.openSucess('Solicitud de pago creada exitosamente');
          this.dialogRef.close(solicitud);
        },
        error: (error) => {
          console.error('Error al crear solicitud:', error);
          this.notificacionService.openAlgoSalioMal('Error al crear solicitud de pago');
          this.loading = false;
        }
      });
  }

  // ============================================================================
  // MÉTODOS PARA MANEJAR CHECKBOXES DE LA TABLA
  // ============================================================================

  /**
   * Verifica si una nota está seleccionada
   */
  isNotaSelected(notaId: number): boolean {
    return this.notasSeleccionadasIds.includes(notaId);
  }

  /**
   * Toggle individual de una nota
   */
  toggleNota(notaId: number, event: any): void {
    if (event.checked) {
      if (!this.notasSeleccionadasIds.includes(notaId)) {
        this.notasSeleccionadasIds.push(notaId);
      }
    } else {
      const index = this.notasSeleccionadasIds.indexOf(notaId);
      if (index > -1) {
        this.notasSeleccionadasIds.splice(index, 1);
      }
    }
    this.updateComputedProperties();
  }

  /**
   * Verifica si todas las notas seleccionables están seleccionadas
   */
  isAllNotasSelected(): boolean {
    const selectableNotas = this.notasDisponiblesComputed.filter(
      nota => nota.estado === 'CONCILIADA' && !nota.pagado
    );
    return selectableNotas.length > 0 && 
           selectableNotas.every(nota => this.notasSeleccionadasIds.includes(nota.id));
  }

  /**
   * Verifica si algunas notas están seleccionadas (para indeterminate)
   */
  isSomeNotasSelected(): boolean {
    const selectableNotas = this.notasDisponiblesComputed.filter(
      nota => nota.estado === 'CONCILIADA' && !nota.pagado
    );
    const selectedSelectableNotas = selectableNotas.filter(
      nota => this.notasSeleccionadasIds.includes(nota.id)
    );
    return selectedSelectableNotas.length > 0 && selectedSelectableNotas.length < selectableNotas.length;
  }

  /**
   * Verifica si hay notas seleccionables
   */
  hasSelectableNotas(): boolean {
    return this.notasDisponiblesComputed.some(
      nota => nota.estado === 'CONCILIADA' && !nota.pagado
    );
  }

  /**
   * Toggle de todas las notas seleccionables
   */
  toggleAllNotas(event: any): void {
    const selectableNotas = this.notasDisponiblesComputed.filter(
      nota => nota.estado === 'CONCILIADA' && !nota.pagado
    );

    if (event.checked) {
      // Seleccionar todas las notas seleccionables que no estén ya seleccionadas
      selectableNotas.forEach(nota => {
        if (!this.notasSeleccionadasIds.includes(nota.id)) {
          this.notasSeleccionadasIds.push(nota.id);
        }
      });
    } else {
      // Deseleccionar todas las notas seleccionables
      selectableNotas.forEach(nota => {
        const index = this.notasSeleccionadasIds.indexOf(nota.id);
        if (index > -1) {
          this.notasSeleccionadasIds.splice(index, 1);
        }
      });
    }
    this.updateComputedProperties();
  }

  /**
   * Cancela el diálogo
   */
  onCancel(): void {
    this.dialogRef.close();
  }
} 