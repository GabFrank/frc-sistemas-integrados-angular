import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';
import { ReporteService } from '../../../reportes/reporte.service';
import { ReportesComponent } from '../../../reportes/reportes/reportes.component';
import { SolicitudPagoService } from '../../compra/gestion-compras/solicitud-pago.service';
import { SolicitudPago, SolicitudPagoEstado } from '../../compra/gestion-compras/solicitud-pago.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { ProveedorService } from '../../../personas/proveedor/proveedor.service';
import { CreateEditSolicitudPagoDialogComponent } from '../create-edit-solicitud-pago-dialog/create-edit-solicitud-pago-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { PedidoService } from '../../compra/pedido.service';
import {
  AddEditNotaRecepcionDialogComponent,
  AddEditNotaRecepcionDialogData
} from '../../compra/gestion-compras/dialogs/add-edit-nota-recepcion-dialog/add-edit-nota-recepcion-dialog.component';
import { GestionPagoDialogComponent } from '../gestion-pago-dialog/gestion-pago-dialog.component';
import {
  AsignarCajaSolicitudDialogComponent, AsignarCajaSolicitudDialogData
} from '../asignar-caja-solicitud-dialog/asignar-caja-solicitud-dialog.component';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';
import { GetSolicitudesPagoPaginatedVariables } from '../../compra/gestion-compras/graphql/getSolicitudesPagoPaginated';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-solicitud-pago',
  templateUrl: './list-solicitud-pago.component.html',
  styleUrls: ['./list-solicitud-pago.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class ListSolicitudPagoComponent implements OnInit {

  titulo = 'Lista de solicitudes de pago';

  expandedSolicitud: SolicitudPago | null = null;

  proveedorControl = new FormControl();
  estadoControl = new FormControl();
  numeroControl = new FormControl();
  monedaControl = new FormControl<number[]>([]);
  monedaList: Moneda[] = [];
  fechaInicioControl = new FormControl();
  fechaFinControl = new FormControl();
  fechaFormGroup: FormGroup;
  today = new Date();

  selectedProveedor: Proveedor;

  estadoToRowClass: Record<string, string> = {
    PENDIENTE: '',
    SOLICITADO: 'row-estado-solicitado',
    DEVUELTO: 'row-estado-devuelto',
    PARCIAL: 'row-estado-parcial',
    CONCLUIDO: 'row-estado-concluido',
    CANCELADO: 'row-estado-cancelado'
  };

  displayedColumns = [
    'numeroSolicitud',
    'proveedor',
    'fechaSolicitud',
    'montoTotal',
    'estado',
    'acciones'
  ];

  estadoOpciones: { value: string; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: SolicitudPagoEstado.PENDIENTE, label: 'Pendiente' },
    { value: SolicitudPagoEstado.SOLICITADO, label: 'Solicitado' },
    { value: SolicitudPagoEstado.DEVUELTO, label: 'Devuelto' },
    { value: SolicitudPagoEstado.PARCIAL, label: 'Parcial' },
    { value: SolicitudPagoEstado.CONCLUIDO, label: 'Concluido' },
    { value: SolicitudPagoEstado.CANCELADO, label: 'Cancelado' }
  ];

  /**
   * Solicitudes paginadas en el central (#772): gana la última página pedida; si falla una página vuelve a la
   * anterior. Las páginas y las recargas usan los filtros del último Buscar.
   */
  pag: PaginacionLista<SolicitudPago> = new PaginacionLista<SolicitudPago>({
    cargar: (page, size) => {
      const f = this.filtrosPedidos;
      return this.solicitudPagoService
        .onGetSolicitudesPagoPaginated(page, size, f.proveedorId, f.estado, f.numero, f.fechaDesde, f.fechaHasta, f.monedaIds)
        .pipe(catchError((err) => {
          // Un rechazo del servidor ya lo avisó el genérico; este aviso es solo para la falta de respuesta.
          if (!err?.errors) this.notificacionService.openWarn('No se pudo cargar la lista de solicitudes: el servidor no responde. Intentá de nuevo.', 6);
          return of(null);
        }));
    },
    pageSize: 25,
    alCargar: (res) => {
      this.filtrosAplicados = this.filtrosPedidos;
      this.sinFilasParaReporte = !res.getTotalElements;
    },
    alFallar: (filtroNuevo) => {
      // La tabla quedó vacía: no hay filtro cargado que imprimir (#390).
      if (filtroNuevo) {
        this.filtrosAplicados = null;
        this.sinFilasParaReporte = true;
      }
    },
  });
  private filtrosPedidos: GetSolicitudesPagoPaginatedVariables;

  /** Asignar una solicitud a una caja es decidir quién la paga: lo hace tesorería. */
  puedeAsignarCaja = false;

  /** Filtros con los que se cargó la tabla: el PDF imprime lo que se ve, no lo tocado sin aplicar. */
  filtrosAplicados: GetSolicitudesPagoPaginatedVariables = null;
  /** Sin filas no hay nada que imprimir; flag y no función en el HTML. */
  sinFilasParaReporte = true;

  constructor(
    private solicitudPagoService: SolicitudPagoService,
    private tabService: TabService,
    public mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private reporteService: ReporteService,
    private dialog: MatDialog,
    private proveedorService: ProveedorService,
    private pedidoService: PedidoService,
    private monedaService: MonedaService,
    private impresionService: ImpresionService
  ) {}

  ngOnInit(): void {
    this.puedeAsignarCaja = this.mainService.tieneAlgunRol([ROLES.TESORERIA_CPP_PAGAR, ROLES.TESORERIA_GESTIONAR]);
    const hoy = new Date();
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    this.fechaInicioControl.setValue(hace7Dias);
    this.fechaFinControl.setValue(hoy);
    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl
    });
    // Aparte de la lista: si las monedas no cargan, la lista funciona igual sin ese filtro.
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) this.monedaList = res;
    });
    this.onFilter();
  }

  /** Repite la página a la vista (tras crear, editar o cancelar). */
  loadPage(): void {
    this.pag.recargar();
  }

  private armarFiltros(): GetSolicitudesPagoPaginatedVariables {
    return {
      proveedorId: this.selectedProveedor?.id ?? null,
      estado: this.estadoControl.value?.trim() || undefined,
      numero: this.numeroControl.value?.trim() || undefined,
      fechaDesde: this.fechaInicioControl.value ? dateToString(this.fechaInicioControl.value, 'yyyy-MM-dd') : undefined,
      fechaHasta: this.fechaFinControl.value ? dateToString(this.fechaFinControl.value, 'yyyy-MM-dd') : undefined,
      monedaIds: this.monedaControl.value?.length ? this.monedaControl.value : undefined
    };
  }

  onFilter(): void {
    this.filtrosPedidos = this.armarFiltros();
    this.pag.filtrar();
  }

  /** PDF de la lista entera (sin paginar) con los filtros con los que se cargó la tabla. */
  onGenerarReporte(): void {
    const filtros = this.filtrosAplicados;
    if (!filtros) return;
    // El nombre es también el del archivo al descargar: lleva la fecha para distinguir un PDF de otro.
    const nombre = `Solicitudes de pago - ${dateToString(new Date(), 'dd-MM-yyyy')}`;
    this.impresionService.imprimir(nombre, () => this.solicitudPagoService.onImprimirReporteSolicitudesPago(filtros), true);
  }

  onResetFiltro(): void {
    this.selectedProveedor = null;
    this.proveedorControl.setValue(null);
    this.proveedorControl.enable();
    this.estadoControl.setValue(null);
    this.monedaControl.setValue([]);
    this.numeroControl.setValue(null);
    const hoy = new Date();
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    this.fechaInicioControl.setValue(hace7Dias);
    this.fechaFinControl.setValue(hoy);
    this.onFilter();
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(CreateEditSolicitudPagoDialogComponent, {
      width: '72vw',
      maxWidth: '1150px',
      height: '82vh',
      data: { proveedorId: this.selectedProveedor?.id }
    });
    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.loadPage();
      }
    });
  }

  onSearchProveedor(): void {
    if (this.selectedProveedor) return;
    const searchText = this.proveedorControl.value?.trim() || null;
    this.proveedorService.onSearchProveedorPorTexto(searchText).subscribe({
      next: (result: Proveedor) => {
        if (result) {
          this.selectedProveedor = result;
          this.proveedorControl.setValue(
            result.persona?.nombre != null
              ? String(result.persona.nombre).toUpperCase()
              : `${result.id}`
          );
          this.proveedorControl.disable();
        } else {
          this.proveedorControl.setValue(null);
        }
      },
      error: () => this.proveedorControl.setValue(null)
    });
  }

  onProveedorKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.selectedProveedor) {
      event.preventDefault();
      this.onSearchProveedor();
    }
  }

  onClearProveedor(): void {
    this.selectedProveedor = null;
    this.proveedorControl.setValue(null);
    this.proveedorControl.enable();
  }

  onEditarPago(row: SolicitudPago): void {
    if (!row?.id) return;
    const dialogRef = this.dialog.open(CreateEditSolicitudPagoDialogComponent, {
      width: '72vw',
      maxWidth: '1150px',
      height: '82vh',
      data: { solicitudPago: row }
    });
    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.loadPage();
      }
    });
  }

  /** Abre la asignación a caja. No recarga la lista: la asignación no es un dato del listado. */
  onAsignarCaja(solicitud: SolicitudPago): void {
    const data: AsignarCajaSolicitudDialogData = { solicitudPago: solicitud };
    this.dialog.open(AsignarCajaSolicitudDialogComponent, { width: '480px', maxWidth: '95vw', data });
  }

  onGestionarPago(row: SolicitudPago): void {
    if (!row?.id) return;
    const dialogRef = this.dialog.open(GestionPagoDialogComponent, {
      width: '420px',
      data: { solicitudPago: row }
    });
    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.loadPage();
      }
    });
  }

  onImprimir(row: SolicitudPago): void {
    if (!row?.id) return;
    this.solicitudPagoService.onImprimirSolicitudPagoPDF(row.id).subscribe({
      next: (pdfBase64) => {
        if (pdfBase64) {
          this.reporteService.onAdd(
            `Solicitud de Pago ${row.numeroSolicitud || row.id}`,
            pdfBase64
          );
          this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, null));
          this.notificacionService.openSucess('PDF agregado a reportes');
        }
      },
      error: (error) => this.avisarImpresionSinRespuesta(error, 'Error al generar PDF: el servidor no respondió.')
    });
  }

  /** En un rechazo el genérico ya mostró el motivo y el corte por tiempo lo avisó el link (#488). */
  private avisarImpresionSinRespuesta(error: any, texto: string): void {
    if (erroresDeRechazo(error) != null || esTimeoutDeLink(error)) {
      return;
    }
    this.notificacionService.openWarn(texto, 6);
  }

  onImprimirTicket(row: SolicitudPago): void {
    if (!row?.id) return;
    this.solicitudPagoService.onImprimirSolicitudPagoTicket(row.id).subscribe({
      next: () => this.notificacionService.openSucess('Ticket enviado a imprimir'),
      error: (error) => this.avisarImpresionSinRespuesta(error,
        'No se pudo confirmar si se imprimió el ticket: revisá antes de repetir.')
    });
  }

  onRowClick(row: SolicitudPago): void {
    this.expandedSolicitud = this.expandedSolicitud === row ? null : row;
  }

  onVerNota(notaRecepcionId: number): void {
    if (!notaRecepcionId) return;
    this.pedidoService.onGetNotaRecepcionById(notaRecepcionId).pipe(untilDestroyed(this)).subscribe({
      next: (nota) => {
        if (nota == null) {
          return; // Error GraphQL: el servicio ya avisó; no se abre una nota vacía como si fuera real (#390)
        }
        const data: AddEditNotaRecepcionDialogData = {
          nota,
          isEdit: true,
          readOnly: true
        };
        this.dialog.open(AddEditNotaRecepcionDialogComponent, {
          width: '80%',
          height: '80%',
          data
        });
      },
      error: () => {
        this.notificacionService.openWarn('No se pudo cargar la nota de recepción: el servidor no responde. Intentá de nuevo.', 6);
      }
    });
  }
}
