import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
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

@UntilDestroy()
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
  @ViewChild(MatPaginator) paginator: MatPaginator;

  titulo = 'Lista de solicitudes de pago';

  dataSource = new MatTableDataSource<SolicitudPago>([]);
  expandedSolicitud: SolicitudPago | null = null;

  proveedorControl = new FormControl();
  estadoControl = new FormControl();
  numeroControl = new FormControl();
  fechaInicioControl = new FormControl();
  fechaFinControl = new FormControl();
  fechaFormGroup: FormGroup;
  today = new Date();

  selectedProveedor: Proveedor;

  estadoToRowClass: Record<string, string> = {
    PENDIENTE: '',
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
    { value: SolicitudPagoEstado.PARCIAL, label: 'Parcial' },
    { value: SolicitudPagoEstado.CONCLUIDO, label: 'Concluido' },
    { value: SolicitudPagoEstado.CANCELADO, label: 'Cancelado' }
  ];

  length = 0;
  pageSize = 25;
  pageIndex = 0;

  constructor(
    private solicitudPagoService: SolicitudPagoService,
    private tabService: TabService,
    public mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private reporteService: ReporteService,
    private dialog: MatDialog,
    private proveedorService: ProveedorService,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    this.fechaInicioControl.setValue(hace7Dias);
    this.fechaFinControl.setValue(hoy);
    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl
    });
    this.loadPage();
  }

  loadPage(): void {
    const proveedorId = this.selectedProveedor?.id ?? null;
    const estado = this.estadoControl.value?.trim() || undefined;
    const numero = this.numeroControl.value?.trim() || undefined;
    const fechaDesde = this.fechaInicioControl.value
      ? dateToString(this.fechaInicioControl.value, 'yyyy-MM-dd')
      : undefined;
    const fechaHasta = this.fechaFinControl.value
      ? dateToString(this.fechaFinControl.value, 'yyyy-MM-dd')
      : undefined;

    this.solicitudPagoService
      .onGetSolicitudesPagoPaginated(
        this.pageIndex,
        this.pageSize,
        proveedorId,
        estado,
        numero,
        fechaDesde,
        fechaHasta
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pageResult) => {
          this.dataSource.data = pageResult?.getContent ?? [];
          this.length = pageResult?.getTotalElements ?? 0;
        },
        error: () => {
          this.notificacionService.openAlgoSalioMal('Error al cargar solicitudes');
        }
      });
  }

  onFilter(): void {
    this.pageIndex = 0;
    this.loadPage();
  }

  onResetFiltro(): void {
    this.selectedProveedor = null;
    this.proveedorControl.setValue(null);
    this.proveedorControl.enable();
    this.estadoControl.setValue(null);
    this.numeroControl.setValue(null);
    const hoy = new Date();
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    this.fechaInicioControl.setValue(hace7Dias);
    this.fechaFinControl.setValue(hoy);
    this.pageIndex = 0;
    this.loadPage();
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(CreateEditSolicitudPagoDialogComponent, {
      width: '60vw',
      height: '70vh',
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
      width: '60vw',
      height: '70vh',
      data: { solicitudPago: row }
    });
    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.loadPage();
      }
    });
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
      error: () => this.notificacionService.openAlgoSalioMal('Error al generar PDF')
    });
  }

  onImprimirTicket(row: SolicitudPago): void {
    if (!row?.id) return;
    this.solicitudPagoService.onImprimirSolicitudPagoTicket(row.id).subscribe({
      next: () => this.notificacionService.openSucess('Ticket enviado a imprimir'),
      error: () => this.notificacionService.openAlgoSalioMal('Error al imprimir ticket')
    });
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadPage();
  }

  onRowClick(row: SolicitudPago): void {
    this.expandedSolicitud = this.expandedSolicitud === row ? null : row;
  }

  onVerNota(notaRecepcionId: number): void {
    if (!notaRecepcionId) return;
    this.pedidoService.onGetNotaRecepcionById(notaRecepcionId).pipe(untilDestroyed(this)).subscribe({
      next: (nota) => {
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
        this.notificacionService.openAlgoSalioMal('Error al cargar la nota de recepción');
      }
    });
  }
}
