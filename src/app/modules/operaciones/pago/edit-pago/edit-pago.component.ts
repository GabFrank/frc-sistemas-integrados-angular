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
import { PagoDetalle } from '../pago-detalle/pago-detalle.model';
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
    private el: ElementRef
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
    this.loadPagoDetalles();
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
      this.valorTotalPagado = this.pagoDetalles.reduce((total, detalle) => total + detalle.total, 0);
      this.faltaPagar = this.valorTotal - this.valorTotalPagado;
    }
  }

  /**
   * Crea un nuevo pago para la solicitud
   */
  createNewPago(): void {
    if (!this.solicitudPago) return;
    
    const newPago = new Pago();
    newPago.solicitudPago = this.solicitudPago;
    newPago.estado = PagoEstado.PENDIENTE;
    newPago.programado = false;
    
    this.savingPago = true;
    this.pagoService.onSavePago(newPago.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(
        (savedPago) => {
          this.pago = savedPago;
          this.savingPago = false;
          // Clear pago detalles since it's a new pago
          this.pagoDetalles = [];
          this.dataSource.data = [];
        },
        (error) => {
          console.error('Error al crear pago:', error);
          this.savingPago = false;
        }
      );
  }

  /**
   * Abre el diálogo para crear un nuevo detalle de pago
   */
  addPagoDetalle(): void {
    if (!this.pago || !this.pago.id) {
      // Si no existe un pago, primero crearlo
      this.createNewPago();
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
    if (confirm('¿Está seguro que desea eliminar este detalle de pago?')) {
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
        }
      );
  }
  
  /**
   * Finaliza el pago cambiando su estado
   */
  finalizarPago(): void {
    if (!this.pago || !this.pago.id) return;
    
    this.pago.estado = PagoEstado.CONCLUIDO;
    this.savingPago = true;
    
    this.pagoService.onSavePago(this.pago.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(
        (savedPago) => {
          this.pago = savedPago;
          this.savingPago = false;
        },
        (error) => {
          console.error('Error al finalizar pago:', error);
          this.savingPago = false;
        }
      );
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
} 