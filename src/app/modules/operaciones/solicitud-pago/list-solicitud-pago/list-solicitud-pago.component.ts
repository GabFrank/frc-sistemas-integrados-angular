import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ReporteService } from '../../../reportes/reporte.service';
import { SolicitudPagoService } from '../../compra/gestion-compras/solicitud-pago.service';
import { SolicitudPago, SolicitudPagoEstado } from '../../compra/gestion-compras/solicitud-pago.model';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { ProveedorService } from '../../../personas/proveedor/proveedor.service';
import { CreateEditSolicitudPagoDialogComponent } from '../create-edit-solicitud-pago-dialog/create-edit-solicitud-pago-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@UntilDestroy()
@Component({
  selector: 'app-list-solicitud-pago',
  templateUrl: './list-solicitud-pago.component.html',
  styleUrls: ['./list-solicitud-pago.component.scss']
})
export class ListSolicitudPagoComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  titulo = 'Lista de solicitudes de pago';

  dataSource = new MatTableDataSource<SolicitudPago>([]);

  proveedorControl = new FormControl();
  estadoControl = new FormControl();

  selectedProveedor: Proveedor;

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
    private proveedorService: ProveedorService
  ) {}

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(): void {
    const proveedorId = this.selectedProveedor?.id ?? null;
    const estado = this.estadoControl.value?.trim() || undefined;

    this.solicitudPagoService
      .onGetSolicitudesPagoPaginated(this.pageIndex, this.pageSize, proveedorId, estado)
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
    this.pageIndex = 0;
    this.loadPage();
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(CreateEditSolicitudPagoDialogComponent, {
      width: '60vw',
      maxHeight: '90vh',
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

  onImprimir(row: SolicitudPago): void {
    if (!row?.id) return;
    this.solicitudPagoService.onImprimirSolicitudPagoPDF(row.id).subscribe({
      next: (pdfBase64) => {
        if (pdfBase64) {
          this.reporteService.onAdd(
            `Solicitud de Pago ${row.numeroSolicitud || row.id}`,
            pdfBase64
          );
          this.notificacionService.openSucess('PDF agregado a reportes');
        }
      },
      error: () => this.notificacionService.openAlgoSalioMal('Error al generar PDF')
    });
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadPage();
  }
}
