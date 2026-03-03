import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatDialog } from '@angular/material/dialog';
import { SolicitudPago, SolicitudPagoEstado } from '../solicitud-pago.model';
import { NotaRecepcion } from '../nota-recepcion.model';
import { SolicitudPagoService } from '../solicitud-pago.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { Pedido } from '../pedido.model';
import { CreateEditSolicitudPagoCompraDialogComponent } from './create-edit-solicitud-pago-compra-dialog/create-edit-solicitud-pago-compra-dialog.component';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { ReportesComponent } from '../../../../reportes/reportes/reportes.component';
import { ReporteService } from '../../../../reportes/reporte.service';

@UntilDestroy()
@Component({
  selector: 'app-solicitud-pago-compra',
  templateUrl: './solicitud-pago-compra.component.html',
  styleUrls: ['./solicitud-pago-compra.component.scss']
})
export class SolicitudPagoCompraComponent implements OnInit, OnChanges {
  
  @Input() pedido!: Pedido;
  @Input() isEditMode: boolean = false;
  @Input() pagoTabState: 'disabled' | 'editable' | 'readonly' = 'disabled';

  // Enum references for template
  SolicitudPagoEstado = SolicitudPagoEstado;

  // Data arrays
  solicitudesPago: SolicitudPago[] = [];
  notasDisponibles: NotaRecepcion[] = [];

  // UI State
  loading = false;
  loadingNotas = false;

  // Computed properties
  solicitudesPagoComputed: SolicitudPago[] = [];
  notasDisponiblesComputed: NotaRecepcion[] = [];
  totalSolicitudesComputed = 0;
  totalMontoSolicitudesComputed = 0;
  canCreateSolicitudComputed = false;

  // Table configuration
  displayedColumns: string[] = ['numero', 'fecha', 'monto', 'estado', 'notas', 'acciones'];

  constructor(
    private dialog: MatDialog,
    private solicitudPagoService: SolicitudPagoService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private tabService: TabService,
    private reporteService: ReporteService
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pedido'] && this.pedido?.id) {
      this.loadData();
    }
    
    // Update computed properties when any input changes
    if (changes['isEditMode'] || changes['pagoTabState']) {
      this.updateComputedProperties();
    }
  }

  /**
   * Carga los datos del componente
   */
    private loadData(): void {
    if (!this.pedido?.id) {
      console.log('SolicitudPago - No pedido ID, skipping data load');
      return;
    }
    
    console.log('SolicitudPago - Loading data for pedido:', this.pedido.id);
    this.loading = true;
    this.loadSolicitudes();
    this.loadNotasDisponibles();
  }

  /**
   * Carga las solicitudes de pago existentes
   */
  private loadSolicitudes(): void {
    this.solicitudPagoService.onGetSolicitudesPorPedido(this.pedido.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (solicitudes) => {
          this.solicitudesPago = solicitudes;
          this.updateComputedProperties();
        },
        error: (error) => {
          console.error('Error al cargar solicitudes:', error);
          this.notificacionService.openAlgoSalioMal('Error al cargar solicitudes de pago');
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  /**
   * Carga las notas de recepción disponibles para pago
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
    // Process solicitudes
    this.solicitudesPagoComputed = this.solicitudesPago;
    this.totalSolicitudesComputed = this.solicitudesPago.length;
    this.totalMontoSolicitudesComputed = this.solicitudesPago.reduce((total, s) => total + (s.montoTotal || 0), 0);

    // Process notas disponibles
    this.notasDisponiblesComputed = this.notasDisponibles;

    // Can create solicitud - need notas available, edit mode, and tab enabled for editing
    this.canCreateSolicitudComputed = this.notasDisponibles.length > 0 && 
                                      this.isEditMode && 
                                      this.pagoTabState === 'editable';
  }

  /**
   * Abre el diálogo para crear nueva solicitud
   */
  onCreateSolicitud(): void {
    if (!this.canCreateSolicitudComputed) return;
    
    const dialogRef = this.dialog.open(CreateEditSolicitudPagoCompraDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: {
        pedido: this.pedido
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Reload data after successful creation
        this.loadData();
      }
    });
  }

  /**
   * Elimina una solicitud de pago
   */
  onDeleteSolicitud(solicitud: SolicitudPago): void {
    if (!this.solicitudPagoService.canDelete(solicitud)) {
      this.notificacionService.openWarn('No se puede eliminar esta solicitud');
      return;
    }

    this.dialogosService.confirm(
      'Eliminar Solicitud',
      `¿Está seguro que desea eliminar la solicitud ${solicitud.numeroSolicitud}?`,
      'Esta acción no se puede deshacer'
    ).subscribe(confirm => {
      if (confirm && solicitud.id) {
        this.loading = true;
        
        this.solicitudPagoService.onDelete(solicitud.id)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: () => {
              this.notificacionService.openSucess('Solicitud eliminada exitosamente');
              this.loadData();
            },
            error: (error) => {
              console.error('Error al eliminar solicitud:', error);
              this.notificacionService.openAlgoSalioMal('Error al eliminar solicitud');
              this.loading = false;
            }
          });
      }
    });
  }

  /**
   * Cambia el estado de una solicitud
   */
  onChangeEstado(solicitud: SolicitudPago, nuevoEstado: SolicitudPagoEstado): void {
    if (!this.solicitudPagoService.canChangeState(solicitud, nuevoEstado)) {
      this.notificacionService.openWarn('Transición de estado no permitida');
      return;
    }

    this.loading = true;
    
    this.solicitudPagoService.onActualizarEstado(solicitud.id!, nuevoEstado)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.notificacionService.openSucess('Estado actualizado exitosamente');
          this.loadData();
        },
        error: (error) => {
          console.error('Error al actualizar estado:', error);
          this.notificacionService.openAlgoSalioMal('Error al actualizar estado');
          this.loading = false;
        }
      });
  }

  /**
   * Imprime una solicitud de pago
   */
  onPrintSolicitud(solicitud: SolicitudPago): void {
    if (!solicitud?.id) {
      this.notificacionService.openWarn('Solicitud de pago no válida');
      return;
    }

    this.solicitudPagoService.onImprimirSolicitudPagoPDF(solicitud.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pdfBase64) => {
          if (pdfBase64) {
            // Agregar el reporte al servicio de reportes
            this.reporteService.onAdd(
              `Solicitud de Pago ${solicitud.numeroSolicitud}`, 
              pdfBase64
            );
            
            // Abrir nueva tab con el reporte
            this.tabService.addTab(
              new Tab(ReportesComponent, 'Reportes', null, null)
            );
            
            this.notificacionService.openSucess('Reporte generado exitosamente');
          } else {
            this.notificacionService.openAlgoSalioMal('Error al generar el reporte');
          }
        },
        error: (error) => {
          console.error('Error al imprimir solicitud:', error);
          this.notificacionService.openAlgoSalioMal('Error al generar el reporte');
        }
      });
  }

  /**
   * Helper method to check if a nota is available for selection
   * This is used internally, not called from template
   */
  private isNotaDisponibleHelper(nota: NotaRecepcion): boolean {
    return nota.estado === 'CONCILIADA' && !nota.pagado;
  }
}