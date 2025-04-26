import { Component, Input, OnInit, ViewChild, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { SolicitudPago } from '../../solicitud-pago/solicitud-pago.model';
import { SolicitudPagoService } from '../../solicitud-pago/solicitud-pago.service';
import { PagoDetalle, PagoDetalleEstado } from '../pago-detalle/pago-detalle.model';
import { Pago, PagoEstado } from '../pago.model';
import { PagoService } from '../pago.service';
import { PagoDetalleService } from '../pago-detalle/pago-detalle.service';
import { PagoDetalleCuotaService } from '../pago-detalle-cuota/pago-detalle-cuota.service';
import { PagoDetalleCuota, PagoDetalleCuotaEstado } from '../pago-detalle-cuota/pago-detalle-cuota.model';
import { PagoDetalleDialogComponent } from './pago-detalle-dialog/pago-detalle-dialog.component';
import { NotaRecepcionAgrupada } from '../../../operaciones/pedido/nota-recepcion/nota-recepcion-agrupada/nota-recepcion-agrupada.model';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotaRecepcion } from '../../../operaciones/pedido/nota-recepcion/nota-recepcion.model';
import { catchError, forkJoin, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

interface NotaPagada {
  numero: string;
  tipoPago: string;
  valorPagado: number;
  valorNota: number;
}

interface DetallePago {
  moneda: string;
  formaPago: string;
  nroCheque: string;
  plazo: number;
  vencimiento: string;
  estado: string;
  valorPagado: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-edit-pago',
  templateUrl: './edit-pago.component.html',
  styleUrls: ['./edit-pago.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class EditPagoComponent implements OnInit, AfterViewInit {
  @ViewChild('containerElement') containerElement: ElementRef;
  
  // Data from TabData
  @Input() data: any;
  solicitudPagoId: number;
  
  // Entity data
  solicitudPago: SolicitudPago;
  pago: Pago;
  selectedNotaRecepcionAgregada: NotaRecepcionAgrupada;
  notasRecepcion: NotaRecepcion[] = [];
  

  // Pago Detalles
  pagoDetalles: PagoDetalle[] = [];
  dataSource = new MatTableDataSource<PagoDetalle>([]);
  displayedColumns: string[] = ['id', 'fuente', 'caja', 'activo', 'estado', 'formaPago', 'moneda', 'total', 'acciones'];
  expandedElement: PagoDetalle | null;
  
  // Expanded row data
  notasPagadas: NotaPagada[] = [];
  detallesPago: DetallePago[] = [];
  pagoDetalleCuotas: PagoDetalleCuota[] = [];
  loadingCuotas: boolean = false;
  
  // Resumen data
  cantidadNotas: number = 0;
  valorTotal: number = 0;
  valorTotalPagado: number = 0;
  faltaPagar: number = 0;
  
  // Loading states
  loadingSolicitudPago = false;
  loadingPago = false;
  loadingPagoDetalles = false;
  loadingNotasRecepcion = false;
  savingPago = false;
  
  // Mock data (will be replaced with real implementation later)
  mockNotasPagadas: NotaPagada[] = [
    { numero: '122.234', tipoPago: 'Total', valorPagado: 3650000, valorNota: 3650000 },
    { numero: '122.239', tipoPago: 'Parcial', valorPagado: 5000000, valorNota: 2000000 }
  ];
  
  mockDetallesPago: DetallePago[] = [
    { moneda: 'GUARANI', formaPago: 'CHEQUE', nroCheque: '445.345', plazo: 30, vencimiento: '15/03/2025', estado: 'PAGADO', valorPagado: 2825000 },
    { moneda: 'GUARANI', formaPago: 'CHEQUE', nroCheque: 'N/A', plazo: 60, vencimiento: '15/04/2025', estado: 'PENDIENTE', valorPagado: 2825000 }
  ];

  // Add a property to track button states
  isFinalizarButtonEnabled: boolean = false;
  isAgregarDetalleButtonEnabled: boolean = true;
  
  // Add properties to store tooltip messages
  finalizarButtonTooltip: string = 'Debe crear un pago primero';
  agregarButtonTooltip: string = 'Debe crear un pago primero';

  constructor(
    private solicitudPagoService: SolicitudPagoService,
    private pagoService: PagoService,
    private pagoDetalleService: PagoDetalleService,
    private pagoDetalleCuotaService: PagoDetalleCuotaService,
    public mainService: MainService,
    public tabService: TabService,
    private dialog: MatDialog,
    private dialogService: DialogosService,
    private renderer: Renderer2,
    private el: ElementRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.data && this.data?.tabData) {
      this.solicitudPagoId = this.data.tabData.data.solicitudPagoId;
      
      // Load solicitud pago data
      this.loadSolicitudPago();
    }
  }

  ngAfterViewInit(): void {
    // Ensure the component takes full height and width
    
  }

  /**
   * Carga los datos de la solicitud de pago
   */
  loadSolicitudPago(): void {
    if (!this.solicitudPagoId) return;
    
    this.loadingSolicitudPago = true;
    this.solicitudPagoService.onGetSolicitudPago(this.solicitudPagoId)
      .pipe(untilDestroyed(this))
      .subscribe(
        (solicitudPago) => {
          console.log('solicitudPago', solicitudPago);
          
          this.solicitudPago = solicitudPago;
          this.loadingSolicitudPago = false;

          // Si es de tipo COMPRA, buscar la información de las notas de recepción
          if (this.solicitudPago.tipo === 'COMPRA' && this.solicitudPago.referenciaId) {
            this.loadNotaRecepcionInfo(this.solicitudPago.referenciaId);
          }
          
          if(this.solicitudPago.pago){
            this.loadPagoForSolicitud();
          } else {
            // if there is no pago, so show a dialog asking user if he wants to create a new pago, use dialogService
            this.dialogService.confirm('Crear Pago', '¿Desea crear un nuevo pago para esta solicitud?', null, null, true, 'Si', 'No').subscribe((result) => {
              if(result){
                this.createNewPago();
              }
            });
          }
          
        },
        (error) => {
          console.error('Error al cargar solicitud de pago:', error);
          this.loadingSolicitudPago = false;
        }
      );
  }

  /**
   * Carga la información de las notas de recepción asociadas a una notaRecepcionAgrupada
   * @param notaRecepcionAgrupadaId ID de la nota de recepción agrupada
   */
  loadNotaRecepcionInfo(notaRecepcionAgrupadaId: number): void {
    this.loadingNotasRecepcion = true;
    
    // En primer lugar, cargamos las notas de recepción asociadas a la nota de recepción agrupada
    this.pagoService.onGetNotasRecepcionPorAgrupada(notaRecepcionAgrupadaId)
      .pipe(
        untilDestroyed(this),
        catchError(error => {
          console.error('Error al cargar notas de recepción:', error);
          this.loadingNotasRecepcion = false;
          return of([]);
        })
      )
      .subscribe(notasRecepcion => {
        this.notasRecepcion = notasRecepcion;
        this.loadingNotasRecepcion = false;
        
        // Calculamos el total de notas y el valor total
        this.calcularTotalesNotasRecepcion();
      });
  }

  /**
   * Calcula los totales basados en las notas de recepción cargadas
   */
  calcularTotalesNotasRecepcion(): void {
    if (!this.notasRecepcion || this.notasRecepcion.length === 0) {
      this.cantidadNotas = 0;
      this.valorTotal = 0;
      return;
    }
    
    // Cantidad de notas es simplemente el número de notas de recepción
    this.cantidadNotas = this.notasRecepcion.length;
    
    // Valor total es la suma de (valor - descuento) de cada nota
    this.valorTotal = this.notasRecepcion.reduce((total, nota) => {
      const valorNeto = (nota.valor || 0) - (nota.descuento || 0);
      return total + valorNeto;
    }, 0);
    
    // Actualizar el valor de faltaPagar
    this.faltaPagar = this.valorTotal - this.valorTotalPagado;
  }

  /**
   * Carga el pago asociado a la solicitud de pago
   */
  loadPagoForSolicitud(): void {
    //here i need to replace the pago search becouse solicitud pago already has the pago
    this.pago = this.solicitudPago.pago;
    
    // Log the pago estado to help with debugging
    console.log('Loaded pago with estado:', this.pago?.estado);
    
    // Load pago details
    this.loadPagoDetalles();
    
    // Update button states based on pago state - this is redundant since loadPagoDetalles also calls it,
    // but we'll keep it to ensure the button states are updated even before details are loaded
    this.updateResumenData();
  }

  /**
   * Carga los detalles del pago
   */
  loadPagoDetalles(): void {
    if (!this.pago || !this.pago.id) return;
    
    this.loadingPagoDetalles = true;
    this.pagoDetalleService.getPagoDetallesPorPagoId(this.pago.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        (detalles) => {
          this.pagoDetalles = detalles;
          this.dataSource.data = this.pagoDetalles;
          this.loadingPagoDetalles = false;
          this.updateResumenData();
        },
        (error) => {
          console.error('Error al cargar detalles del pago:', error);
          this.loadingPagoDetalles = false;
        }
      );
  }

  /**
   * Actualiza los datos de resumen basados en los detalles de pago
   */
  updateResumenData(): void {
    // Calculate valor total pagado based on real pago details
    if (this.pagoDetalles && this.pagoDetalles.length > 0) {
      // Only count non-CANCELADO detalles for payment amounts
      const activePagoDetalles = this.pagoDetalles.filter(
        detalle => detalle.estado !== PagoDetalleEstado.CANCELADO
      );
      
      // Calculate valorTotalPagado from active pagoDetalles
      this.valorTotalPagado = activePagoDetalles.reduce((total, detalle) => total + detalle.total, 0);
      this.faltaPagar = this.valorTotal - this.valorTotalPagado;
      
      // Debug log the payment amounts to verify calculations
      console.log('DEBUG - Valores de pago:', {
        valorTotal: this.valorTotal,
        valorTotalPagado: this.valorTotalPagado,
        faltaPagar: this.faltaPagar,
        totalPagoDetalles: this.pagoDetalles.length,
        activePagoDetalles: activePagoDetalles.length,
        canceledPagoDetalles: this.pagoDetalles.length - activePagoDetalles.length,
        pagoDetalles: this.pagoDetalles.map(d => ({ id: d.id, total: d.total, estado: d.estado }))
      });
      
      // Check if faltaPagar is zero (with small threshold for floating point comparison)
      const isAmountsEqual = Math.abs(this.faltaPagar) < 0.01; 
      
      // Check if all active pagoDetalles have estado PENDIENTE
      const allDetailsPendiente = activePagoDetalles.every(detalle => 
        detalle.estado === PagoDetalleEstado.PENDIENTE
      );
      
      // Check if any active pagoDetalles have estado ABIERTO
      const hasAnyAbierto = activePagoDetalles.some(detalle => 
        detalle.estado === PagoDetalleEstado.ABIERTO
      );
      
      // Enable Finalizar button only if:
      // 1. Pago estado is ABIERTO (not PENDIENTE, CONCLUIDO, etc.)
      // 2. Total paid equals total amount (faltaPagar is 0)
      // 3. All active pagoDetalles have estado PENDIENTE
      // 4. No pagoDetalles have estado ABIERTO
      this.isFinalizarButtonEnabled = 
        this.pago?.estado === PagoEstado.ABIERTO &&
        isAmountsEqual && 
        allDetailsPendiente && 
        !hasAnyAbierto;
      
      // Enable Agregar button only if:
      // 1. faltaPagar is greater than 0 (amounts not equal)
      // 2. AND pago is in ABIERTO state
      // OR (for edge case with all cancelled details):
      // 1. There are no active details (all are cancelled)
      // 2. AND pago is in ABIERTO state
      const allDetallesCancelled = activePagoDetalles.length === 0 && this.pagoDetalles.length > 0;
      
      this.isAgregarDetalleButtonEnabled = 
        (!isAmountsEqual && this.isPagoStateAllowsEditing()) || 
        (allDetallesCancelled && this.isPagoStateAllowsEditing());
      
      // Update tooltip for the Finalizar button
      this.updateFinalizarButtonTooltip(isAmountsEqual, allDetailsPendiente, hasAnyAbierto);
      
      // Update tooltip for the Agregar button
      this.updateAgregarButtonTooltip(isAmountsEqual, allDetallesCancelled);
      
      console.log('Button states updated:', {
        valorTotal: this.valorTotal,
        valorTotalPagado: this.valorTotalPagado,
        faltaPagar: this.faltaPagar,
        isAmountsEqual,
        allDetailsPendiente,
        hasAnyAbierto,
        allDetallesCancelled,
        pagoEstado: this.pago?.estado,
        isFinalizarButtonEnabled: this.isFinalizarButtonEnabled,
        isAgregarDetalleButtonEnabled: this.isAgregarDetalleButtonEnabled
      });
    } else {
      // If no payment details exist, disable finalizar button and enable agregar button
      this.isFinalizarButtonEnabled = false;
      this.isAgregarDetalleButtonEnabled = this.isPagoStateAllowsEditing();
      
      // Update tooltips
      this.updateFinalizarButtonTooltip(false, false, false);
      this.updateAgregarButtonTooltip(false, false);
    }
  }

  /**
   * Updates the tooltip for the Finalizar button based on current state
   */
  private updateFinalizarButtonTooltip(isAmountsEqual: boolean, allDetailsPendiente: boolean, hasAnyAbierto: boolean): void {
    if (!this.pago) {
      this.finalizarButtonTooltip = 'Debe crear un pago primero';
      return;
    }
    
    if (this.savingPago) {
      this.finalizarButtonTooltip = 'Guardando pago...';
      return;
    }
    
    // First check the pago estado - most important condition
    if (this.pago.estado === PagoEstado.PENDIENTE) {
      this.finalizarButtonTooltip = 'El pago ya está en estado PENDIENTE - use el botón Reabrir para modificarlo';
      return;
    }
    
    if (this.pago.estado !== PagoEstado.ABIERTO) {
      this.finalizarButtonTooltip = `No se puede finalizar un pago en estado ${this.pago.estado}`;
      return;
    }
    
    // Then check payment amounts
    if (!isAmountsEqual) {
      this.finalizarButtonTooltip = `Falta pagar ${this.faltaPagar.toLocaleString()} para poder finalizar`;
      return;
    }
    
    // Then check details estado
    if (hasAnyAbierto) {
      this.finalizarButtonTooltip = 'No se puede finalizar mientras haya detalles en estado ABIERTO';
      return;
    }
    
    if (!allDetailsPendiente) {
      this.finalizarButtonTooltip = 'Todos los detalles activos deben estar en estado PENDIENTE';
      return;
    }
    
    if (!this.isFinalizarButtonEnabled) {
      this.finalizarButtonTooltip = 'No se cumplen todas las condiciones para finalizar el pago';
      return;
    }
    
    this.finalizarButtonTooltip = 'Finalizar el pago y cambiarlo a estado PENDIENTE';
  }
  
  /**
   * Updates the tooltip for the Agregar button based on current state
   */
  private updateAgregarButtonTooltip(isAmountsEqual: boolean, allDetallesCancelled: boolean): void {
    if (!this.pago) {
      this.agregarButtonTooltip = 'Debe crear un pago primero';
      return;
    }
    
    if (this.pago.estado !== PagoEstado.ABIERTO) {
      this.agregarButtonTooltip = 'Solo se pueden agregar detalles cuando el pago está en estado ABIERTO';
      return;
    }
    
    if (this.savingPago) {
      this.agregarButtonTooltip = 'Guardando pago...';
      return;
    }
    
    // Check if there are only CANCELADO detalles
    if (allDetallesCancelled) {
      this.agregarButtonTooltip = 'Todos los detalles están CANCELADOS, puede agregar uno nuevo';
      return;
    }
    
    if (isAmountsEqual) {
      this.agregarButtonTooltip = 'No es posible agregar más detalles de pago porque el monto total ya está cubierto';
      return;
    }
    
    if (!this.isAgregarDetalleButtonEnabled) {
      this.agregarButtonTooltip = 'No se pueden cumplir las condiciones para agregar un detalle de pago';
      return;
    }
    
    // Default message if button is enabled
    this.agregarButtonTooltip = `Agregar un nuevo detalle de pago (Monto disponible: ${this.faltaPagar.toLocaleString()})`;
  }

  /**
   * Checks if the current pago state allows editing
   * @returns true if the pago state allows adding or editing details
   */
  isPagoStateAllowsEditing(): boolean {
    // Only allow editing if pago exists and its estado is ABIERTO
    if (!this.pago) return false;
    
    // Only allow editing in ABIERTO state
    return this.pago.estado === PagoEstado.ABIERTO;
  }

  /**
   * Crea un nuevo pago para la solicitud
   */
  createNewPago(): void {
    if (!this.solicitudPago) return;
    
    const newPago = new Pago();
    newPago.solicitudPago = this.solicitudPago;
    newPago.estado = PagoEstado.ABIERTO;
    newPago.programado = false;
    
    this.savingPago = true;
    
    // Update tooltips to show saving status
    this.finalizarButtonTooltip = 'Guardando pago...';
    this.agregarButtonTooltip = 'Guardando pago...';
    
    this.pagoService.onSavePago(newPago.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(
        (savedPago) => {
          this.pago = savedPago;
          this.savingPago = false;
          // Clear pago detalles since it's a new pago
          this.pagoDetalles = [];
          this.dataSource.data = [];
          
          // Update button states after creating the pago
          this.updateResumenData();
          
          this.snackBar.open('Pago creado correctamente', 'Cerrar', { duration: 3000 });
        },
        (error) => {
          console.error('Error al crear pago:', error);
          this.savingPago = false;
          
          // Update tooltips on error
          this.finalizarButtonTooltip = 'Debe crear un pago primero';
          this.agregarButtonTooltip = 'Debe crear un pago primero';
          
          this.snackBar.open('Error al crear el pago', 'Cerrar', { duration: 3000 });
        }
      );
  }

  /**
   * Abre el diálogo para crear un nuevo detalle de pago
   */
  addPagoDetalle(): void {
    // Check if add button should be enabled
    if (!this.isAgregarDetalleButtonEnabled) {
      this.snackBar.open('No es posible agregar más detalles de pago porque el monto total ya está cubierto', 'Cerrar', { duration: 5000 });
      return;
    }

    // Check if pago exists
    if (!this.pago || !this.pago.id) {
      // Si no existe un pago, primero crearlo
      this.createNewPago();
      return;
    }
    
    // Check if pago is in ABIERTO state
    if (this.pago.estado !== PagoEstado.ABIERTO) {
      this.snackBar.open('Solo se pueden agregar detalles de pago cuando el pago está en estado ABIERTO', 'Cerrar', { duration: 5000 });
      return;
    }
    
    // Prepare initial data for dialog based on loaded notaRecepcion records
    const dialogData: any = {
      pagoId: this.pago.id,
      maxAmount: this.faltaPagar // Pass the remaining amount to be paid as maximum allowable amount
    };
    
    // Only attempt to pre-populate if we have notaRecepcion data
    if (this.notasRecepcion && this.notasRecepcion.length > 0) {
      // Check if all notas have the same moneda
      const firstMoneda = this.notasRecepcion[0]?.pedido?.moneda?.id;
      const allSameMoneda = this.notasRecepcion.every(nota => 
        nota.pedido?.moneda?.id === firstMoneda
      );
      
      // Check if all notas have the same forma de pago
      const firstFormaPago = this.notasRecepcion[0]?.pedido?.formaPago?.id;
      const allSameFormaPago = this.notasRecepcion.every(nota => 
        nota.pedido?.formaPago?.id === firstFormaPago
      );
      
      // Add pre-selected values if all notes have the same value
      if (allSameMoneda && firstMoneda) {
        dialogData.preselectedMonedaId = firstMoneda;
      }
      
      if (allSameFormaPago && firstFormaPago) {
        dialogData.preselectedFormaPagoId = firstFormaPago;
      }
      
      // Always pass the calculated total value
      // If faltaPagar is less than valorTotal, use faltaPagar as the preselected total
      dialogData.preselectedTotal = Math.min(this.valorTotal, this.faltaPagar);
    }
    
    this.dialog.open(PagoDetalleDialogComponent, {
      width: '70vw',
      data: dialogData,
      disableClose: true,
      panelClass: 'dark-theme-dialog'
    }).afterClosed().subscribe(result => {
      if (result) {
        // Reload pago detalles
        this.loadPagoDetalles();
      }
    });
  }

  /**
   * Edita un detalle de pago existente
   * @param pagoDetalle Detalle de pago a editar
   */
  editPagoDetalle(pagoDetalle: PagoDetalle): void {
    // Check if pago is in ABIERTO state
    if (!this.pago || this.pago.estado !== PagoEstado.ABIERTO) {
      this.snackBar.open('Solo se pueden editar detalles de pago cuando el pago está en estado ABIERTO', 'Cerrar', { duration: 5000 });
      return;
    }
    
    // For edit, calculate the maximum allowable amount
    // This should be faltaPagar + the current detalle's total (since we're editing it)
    const maxEditAmount = this.faltaPagar + pagoDetalle.total;
    
    this.dialog.open(PagoDetalleDialogComponent, {
      width: '70vw',
      data: {
        pagoId: this.pago.id,
        pagoDetalle: pagoDetalle,
        maxAmount: maxEditAmount
      },
      disableClose: true,
      panelClass: 'dark-theme-dialog'
    }).afterClosed().subscribe(result => {
      if (result) {
        // Reload pago detalles
        this.loadPagoDetalles();
      }
    });
  }

  /**
   * Elimina un detalle de pago
   * @param pagoDetalle Detalle de pago a eliminar
   */
  deletePagoDetalle(pagoDetalle: PagoDetalle): void {
    // Check if pago is in ABIERTO state
    if (!this.pago || this.pago.estado !== PagoEstado.ABIERTO) {
      this.snackBar.open('Solo se pueden eliminar detalles de pago cuando el pago está en estado ABIERTO', 'Cerrar', { duration: 5000 });
      return;
    }
    
    this.dialogService.confirm(
      'ELIMINAR DETALLE DE PAGO',
      '¿ESTÁ SEGURO QUE DESEA ELIMINAR ESTE DETALLE DE PAGO?'
    ).subscribe(result => {
      if (result) {
        this.pagoDetalleService.deletePagoDetalle(pagoDetalle.id)
          .pipe(untilDestroyed(this))
          .subscribe(
            () => {
              // Reload pago detalles
              this.loadPagoDetalles();
            },
            (error) => {
              console.error('Error al eliminar detalle de pago:', error);
            }
          );
      }
    });
  }
  
  /**
   * Carga las notas pagadas cuando se expande una fila
   * @param pagoDetalle Detalle de pago
   */
  loadNotasPagadas(pagoDetalle: PagoDetalle): void {
    // Mock implementation - will be replaced with real data later
    this.notasPagadas = [...this.mockNotasPagadas];
  }
  
  /**
   * Carga los detalles de pago cuando se expande una fila
   * @param pagoDetalle Detalle de pago
   */
  loadDetallesPago(pagoDetalle: PagoDetalle): void {
    // Mock implementation - will be replaced with real data later
    this.detallesPago = [...this.mockDetallesPago];
  }
  
  /**
   * Maneja la expansión de una fila
   * @param pagoDetalle Detalle de pago a expandir
   */
  toggleExpand(pagoDetalle: PagoDetalle): void {
    this.expandedElement = this.expandedElement === pagoDetalle ? null : pagoDetalle;
    
    if (this.expandedElement) {
      this.loadPagoDetalleCuotas(pagoDetalle);
    }
  }
  
  /**
   * Carga las cuotas de un detalle de pago
   * @param pagoDetalle Detalle de pago
   */
  loadPagoDetalleCuotas(pagoDetalle: PagoDetalle): void {
    if (!pagoDetalle || !pagoDetalle.id) return;
    
    this.loadingCuotas = true;
    this.pagoDetalleCuotas = [];
    
    this.pagoDetalleCuotaService.onGetPagoDetalleCuotasPorPagoDetalleId(pagoDetalle.id)
      .pipe(
        untilDestroyed(this),
        catchError(error => {
          console.error('Error al cargar cuotas del detalle de pago:', error);
          this.loadingCuotas = false;
          return of([]);
        })
      )
      .subscribe(
        (cuotas) => {
          this.pagoDetalleCuotas = cuotas;
          this.loadingCuotas = false;
          
          // Update the PagoDetalle estado based on cuotas
          this.updatePagoDetalleEstado(pagoDetalle, cuotas);
        }
      );
  }
  
  /**
   * Actualiza el estado de un PagoDetalle basado en sus cuotas
   * @param pagoDetalle El detalle de pago a actualizar
   * @param cuotas Las cuotas asociadas al detalle de pago
   */
  updatePagoDetalleEstado(pagoDetalle: PagoDetalle, cuotas: PagoDetalleCuota[]): void {
    if (!pagoDetalle || !cuotas) return;
    
    // Create a new instance of PagoDetalle to use the method
    const detalleToUpdate = new PagoDetalle();
    Object.assign(detalleToUpdate, pagoDetalle);
    
    console.log('EditPago: Updating estado for PagoDetalle', {
      id: pagoDetalle.id,
      currentEstado: pagoDetalle.estado,
      total: pagoDetalle.total,
      cuotas: cuotas.length,
      cuotasSum: cuotas.reduce((sum, c) => sum + (c.totalFinal || 0), 0),
      allPendiente: cuotas.every(c => c.estado === PagoDetalleCuotaEstado.PENDIENTE)
    });
    
    // Update the estado based on cuotas
    const newEstado = detalleToUpdate.updateEstadoBasedOnCuotas(cuotas);
    
    // If the estado has changed, update it in the database
    if (newEstado !== pagoDetalle.estado) {
      console.log(`EditPago: Estado of PagoDetalle ${pagoDetalle.id} changed: ${pagoDetalle.estado} -> ${newEstado}`);
      
      // Update in the UI immediately
      pagoDetalle.estado = newEstado;
      
      // Update pagoDetalle in the database
      const pagoDetalleInput = pagoDetalle.toInput();
      this.pagoDetalleService.update(pagoDetalleInput)
        .pipe(untilDestroyed(this))
        .subscribe(
          updatedDetalle => {
            console.log('EditPago: PagoDetalle updated successfully with new estado:', updatedDetalle.estado);
            
            // Find the pagoDetalle in the data source and update it
            const index = this.pagoDetalles.findIndex(d => d.id === updatedDetalle.id);
            if (index !== -1) {
              this.pagoDetalles[index] = updatedDetalle;
              this.dataSource.data = [...this.pagoDetalles]; // Refresh the data source
            }
          },
          error => {
            console.error('EditPago: Error updating PagoDetalle estado:', error);
          }
        );
    } else {
      console.log(`EditPago: Estado of PagoDetalle ${pagoDetalle.id} remains: ${pagoDetalle.estado}`);
    }
  }
  
  /**
   * Finaliza el pago cambiando su estado
   */
  finalizarPago(): void {
    if (!this.pago || !this.pago.id) {
      this.snackBar.open('No hay un pago para finalizar', 'Cerrar', { duration: 5000 });
      return;
    }
    
    // Re-check all validation criteria
    
    // Check if the pago is already in PENDIENTE state
    if (this.pago.estado === PagoEstado.PENDIENTE) {
      this.snackBar.open('Este pago ya está en estado PENDIENTE', 'Cerrar', { duration: 5000 });
      return;
    }
    
    // Check if the pago is in ABIERTO state
    if (this.pago.estado !== PagoEstado.ABIERTO) {
      this.snackBar.open(`No se puede finalizar un pago en estado ${this.pago.estado}`, 'Cerrar', { duration: 5000 });
      return;
    }
    
    // Check if the amounts match (within a small threshold for floating point comparison)
    const amountsMatch = Math.abs(this.faltaPagar) < 0.01;
    if (!amountsMatch) {
      this.snackBar.open(`No es posible finalizar el pago porque el monto pagado no coincide con el monto total. Falta pagar: ${this.faltaPagar.toLocaleString()}`, 'Cerrar', { duration: 5000 });
      return;
    }
    
    // Check if all active details are in PENDIENTE estado
    const activePagoDetalles = this.pagoDetalles.filter(
      detalle => detalle.estado !== PagoDetalleEstado.CANCELADO
    );
    
    const allDetailsPendiente = activePagoDetalles.every(detalle => 
      detalle.estado === PagoDetalleEstado.PENDIENTE
    );
    
    // Check if any active details are in ABIERTO estado
    const hasAnyAbierto = activePagoDetalles.some(detalle => 
      detalle.estado === PagoDetalleEstado.ABIERTO
    );
    
    if (!allDetailsPendiente || hasAnyAbierto) {
      this.snackBar.open('No es posible finalizar el pago porque hay detalles de pago que no están en estado PENDIENTE', 'Cerrar', { duration: 5000 });
      return;
    }
    
    // Confirm with user before finalizing
    this.dialogService.confirm(
      'FINALIZAR PAGO',
      '¿ESTÁ SEGURO QUE DESEA FINALIZAR ESTE PAGO?',
      'Una vez finalizado, el pago pasará a estado PENDIENTE a la espera de ser concluido.'
    ).subscribe(result => {
      if (result) {
        // Set estado to PENDIENTE as per requirements
        this.pago.estado = PagoEstado.PENDIENTE;
        this.savingPago = true;
        
        // Update UI state immediately to disable buttons
        this.isFinalizarButtonEnabled = false;
        this.isAgregarDetalleButtonEnabled = false;
        
        // Update tooltips immediately
        this.finalizarButtonTooltip = 'El pago ya está en estado PENDIENTE - use el botón Reabrir para modificarlo';
        this.agregarButtonTooltip = 'Solo se pueden agregar detalles cuando el pago está en estado ABIERTO';
        
        // Create proper input object to ensure all required fields are included
        let newPago = new Pago();
        Object.assign(newPago, this.pago);
        const pagoInput = newPago.toInput();
        console.log('Guardando pago con estado:', pagoInput.estado);
        
        this.pagoService.onSavePago(pagoInput)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (savedPago) => {
              console.log('Pago guardado exitosamente:', savedPago);
              this.pago = savedPago;
              this.savingPago = false;
              
              // Update UI states based on new pago estado
              this.updateResumenData();
              
              this.snackBar.open('El pago ha sido finalizado y está en estado PENDIENTE', 'Cerrar', { duration: 5000 });
            },
            error: (error) => {
              console.error('Error al finalizar pago:', error);
              this.savingPago = false;
              
              // Reset the pago estado in the UI if there was an error
              if (this.pago) {
                this.pago.estado = PagoEstado.ABIERTO;
                // Update button states to reflect the reset state
                this.updateResumenData();
              }
              
              this.snackBar.open('Error al finalizar el pago: ' + (error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
            }
          });
      }
    });
  }
  
  /**
   * Toggles el estado de programado del pago
   */
  toggleProgramado(): void {
    if (!this.pago || !this.pago.id) return;
    
    this.pago.programado = !this.pago.programado;
    this.savingPago = true;
    
    this.pagoService.onSavePago(this.pago.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(
        (savedPago) => {
          this.pago = savedPago;
          this.savingPago = false;
        },
        (error) => {
          console.error('Error al cambiar estado programado:', error);
          this.savingPago = false;
        }
      );
  }

  /**
   * Reopens a pago in PENDIENTE state by changing its state back to ABIERTO
   */
  reopenPago(): void {
    if (!this.pago || !this.pago.id) return;
    
    // Only allow reopening if pago is in PENDIENTE state
    if (this.pago.estado !== PagoEstado.PENDIENTE) {
      this.snackBar.open('Solo se pueden reabrir pagos en estado PENDIENTE', 'Cerrar', { duration: 5000 });
      return;
    }
    
    // Confirm with user before reopening
    this.dialogService.confirm(
      'REABRIR PAGO',
      '¿ESTÁ SEGURO QUE DESEA REABRIR ESTE PAGO?',
      'Al reabrir el pago, podrá modificar los detalles de pago y las cuotas. El pago volverá al estado ABIERTO.'
    ).subscribe(result => {
      if (result) {
        // Set estado to ABIERTO to allow editing
        this.pago.estado = PagoEstado.ABIERTO;
        this.savingPago = true;
        
        // Update tooltips before save to immediate feedback
        this.finalizarButtonTooltip = 'Verificando condiciones para finalizar...';
        this.agregarButtonTooltip = 'Verificando condiciones para agregar...';
        
        // Create a proper input object to save
        let newPago = new Pago();
        Object.assign(newPago, this.pago);
        const pagoInput = newPago.toInput();
        
        console.log('Reabriendo pago con estado:', pagoInput.estado);
        
        this.pagoService.onSavePago(pagoInput)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (savedPago) => {
              console.log('Pago reabierto exitosamente:', savedPago);
              this.pago = savedPago;
              this.savingPago = false;
              
              // Update button states immediately after reopening
              this.updateResumenData();
              
              this.snackBar.open('El pago ha sido reabierto y está en estado ABIERTO', 'Cerrar', { duration: 5000 });
            },
            error: (error) => {
              console.error('Error al reabrir pago:', error);
              this.savingPago = false;
              
              // Reset the pago estado in the UI if there was an error
              if (this.pago) {
                this.pago.estado = PagoEstado.PENDIENTE;
                // Update button states and tooltips after error
                this.updateResumenData();
              }
              
              this.snackBar.open('Error al reabrir el pago: ' + (error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
            }
          });
      }
    });
  }

  /**
   * Cancela un detalle de pago cambiando su estado a CANCELADO
   * @param pagoDetalle Detalle de pago a cancelar
   */
  cancelPagoDetalle(pagoDetalle: PagoDetalle): void {
    // Check if pago is in ABIERTO state
    if (!this.pago || this.pago.estado !== PagoEstado.ABIERTO) {
      this.snackBar.open('Solo se pueden cancelar detalles de pago cuando el pago está en estado ABIERTO', 'Cerrar', { duration: 5000 });
      return;
    }

    // Check if the pagoDetalle is already canceled
    if (pagoDetalle.estado === PagoDetalleEstado.CANCELADO) {
      this.snackBar.open('Este detalle de pago ya está cancelado', 'Cerrar', { duration: 5000 });
      return;
    }
    
    this.dialogService.confirm(
      'CANCELAR DETALLE DE PAGO',
      '¿ESTÁ SEGURO QUE DESEA CANCELAR ESTE DETALLE DE PAGO?',
      'Esta operación cancelará todas las cuotas pendientes asociadas y no se puede deshacer.'
    ).subscribe(result => {
      if (result) {
        this.savingPago = true;
        
        // Create a new PagoDetalle object to use the cancel method
        const detalleToCancel = new PagoDetalle();
        Object.assign(detalleToCancel, pagoDetalle);
        detalleToCancel.cancel(); // Sets estado to CANCELADO
        
        // Create input object for the update
        const pagoDetalleInput = detalleToCancel.toInput();
        
        // Update in the database
        this.pagoDetalleService.update(pagoDetalleInput)
          .pipe(untilDestroyed(this))
          .subscribe(
            (updatedDetalle) => {
              console.log('Detalle de pago cancelado:', updatedDetalle);
              
              // We also need to cancel all active cuotas
              this.cancelAllCuotasForPagoDetalle(pagoDetalle.id);
            },
            (error) => {
              console.error('Error al cancelar detalle de pago:', error);
              this.savingPago = false;
              this.snackBar.open('Error al cancelar el detalle de pago', 'Cerrar', { duration: 5000 });
            }
          );
      }
    });
  }

  /**
   * Cancela todas las cuotas asociadas a un detalle de pago
   * @param pagoDetalleId ID del detalle de pago
   */
  private cancelAllCuotasForPagoDetalle(pagoDetalleId: number): void {
    this.pagoDetalleCuotaService.onGetPagoDetalleCuotasPorPagoDetalleId(pagoDetalleId)
      .pipe(
        untilDestroyed(this),
        catchError(error => {
          console.error('Error al cargar cuotas para cancelar:', error);
          return of([]);
        })
      )
      .subscribe(cuotas => {
        // Filter for active cuotas that are not already canceled
        const activeCuotas = cuotas.filter(c => c.estado !== PagoDetalleCuotaEstado.CANCELADO);
        
        if (activeCuotas.length === 0) {
          // No active cuotas to cancel, just reload the pago detalles
          this.loadPagoDetalles();
          this.savingPago = false;
          this.snackBar.open('Detalle de pago cancelado correctamente', 'Cerrar', { duration: 3000 });
          return;
        }
        
        // Prepare an array of observables for canceling each cuota
        const cancelObservables = activeCuotas.map(cuota => {
          const cancelInput = {
            id: cuota.id,
            pagoDetalleId: pagoDetalleId,
            numeroCuota: cuota.numeroCuota,
            fechaVencimiento: dateToString(cuota.fechaVencimiento),
            totalFinal: cuota.totalFinal,
            totalPagado: cuota.totalPagado,
            estado: PagoDetalleCuotaEstado.CANCELADO,
            creadoEn: dateToString(cuota.creadoEn)
          };
          
          return this.pagoDetalleCuotaService.onSavePagoDetalleCuota(cancelInput);
        });
        
        // Execute all cancellations in parallel
        forkJoin(cancelObservables)
          .pipe(untilDestroyed(this))
          .subscribe(
            () => {
              // Reload pago detalles after all cuotas are canceled
              this.loadPagoDetalles();
              this.savingPago = false;
              this.snackBar.open('Detalle de pago y cuotas canceladas correctamente', 'Cerrar', { duration: 3000 });
            },
            (error) => {
              console.error('Error al cancelar cuotas:', error);
              this.savingPago = false;
              this.snackBar.open('Error al cancelar cuotas', 'Cerrar', { duration: 5000 });
              
              // Still reload pago detalles to show any partial updates
              this.loadPagoDetalles();
            }
          );
      });
  }
} 