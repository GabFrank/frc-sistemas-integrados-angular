/**
 * LEGACY: Reemplazado por ListSolicitudPagoComponent (list-solicitud-pago).
 * Mantener solo por referencia; no está declarado en el módulo.
 */
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { SolicitudPagoService } from '../../compra/gestion-compras/solicitud-pago.service';
import { SolicitudPago, SolicitudPagoEstado } from '../../compra/gestion-compras/solicitud-pago.model';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { SolicitudPagoPageResult } from '../../compra/gestion-compras/graphql/getSolicitudesPagoPaginated';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ReporteService } from '../../../reportes/reporte.service';
import { ReportesComponent } from '../../../reportes/reportes/reportes.component';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import {
  SearchListDialogComponent,
  SearchListtDialogData,
  TableData
} from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { ProveedoresSearchByPersonaPageGQL } from '../../../personas/proveedor/graphql/proveedorSearchByPersonaPage';
import { CreateEditSolicitudPagoDialogComponent } from '../create-edit-solicitud-pago-dialog/create-edit-solicitud-pago-dialog.component';

const PAGE_SIZE = 20;

/** @deprecated LEGACY - Usar app-list-solicitud-pago */
@Component({
  selector: 'app-solicitud-pago-dashboard',
  templateUrl: './solicitud-pago-dashboard.component.html',
  styleUrls: ['./solicitud-pago-dashboard.component.scss']
})
export class SolicitudPagoDashboardComponent implements OnInit {
  dataSource = new MatTableDataSource<SolicitudPago>([]);
  displayedColumns: string[] = ['numeroSolicitud', 'proveedor', 'fechaSolicitud', 'montoTotal', 'estado', 'acciones'];

  page: SolicitudPagoPageResult;
  listComputed: SolicitudPago[] = [];
  selectedProveedor: Proveedor;
  selectedEstado: string = '';
  proveedorNombreDisplay = '';
  currentPageIndex = 0;
  loading = false;

  estadoOpciones: { value: string; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: SolicitudPagoEstado.PENDIENTE, label: 'Pendiente' },
    { value: SolicitudPagoEstado.PARCIAL, label: 'Parcial' },
    { value: SolicitudPagoEstado.CONCLUIDO, label: 'Concluido' },
    { value: SolicitudPagoEstado.CANCELADO, label: 'Cancelado' }
  ];

  constructor(
    private solicitudPagoService: SolicitudPagoService,
    private notificacionService: NotificacionSnackbarService,
    private reporteService: ReporteService,
    private tabService: TabService,
    private dialog: MatDialog,
    private proveedorSearchPage: ProveedoresSearchByPersonaPageGQL
  ) {}

  ngOnInit(): void {
    this.loadPage(0);
  }

  loadPage(pageIndex: number): void {
    this.loading = true;
    const proveedorId = this.selectedProveedor?.id;
    const estado = this.selectedEstado || undefined;
    this.solicitudPagoService
      .onGetSolicitudesPagoPaginated(pageIndex, PAGE_SIZE, proveedorId, estado)
      .subscribe({
        next: (pageResult) => {
          this.page = pageResult;
          this.listComputed = pageResult?.getContent || [];
          this.dataSource.data = this.listComputed;
          this.currentPageIndex = pageIndex;
        },
        error: () => {
          this.notificacionService.openAlgoSalioMal('Error al cargar solicitudes');
        }
      })
      .add(() => (this.loading = false));
  }

  onFiltrar(): void {
    this.loadPage(0);
  }

  onBuscarProveedor(): void {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'Id', width: '80px' },
      { id: 'persona.nombre', nombre: 'Nombre', width: '200px' }
    ];
    const data: SearchListtDialogData = {
      titulo: 'Buscar proveedor',
      tableData,
      query: this.proveedorSearchPage,
      search: true,
      paginator: true,
      multiple: false
    };
    this.dialog
      .open(SearchListDialogComponent, { data, width: '600px' })
      .afterClosed()
      .subscribe((selected: Proveedor) => {
        if (selected) {
          this.selectedProveedor = selected;
          this.proveedorNombreDisplay = selected?.persona?.nombre != null ? String(selected.persona.nombre).toUpperCase() : '';
          this.loadPage(0);
        }
      });
  }

  onQuitarProveedor(): void {
    this.selectedProveedor = null;
    this.proveedorNombreDisplay = '';
    this.loadPage(0);
  }

  onNuevaSolicitud(): void {
    const dialogRef = this.dialog.open(CreateEditSolicitudPagoDialogComponent, {
      width: '60vw',
      maxHeight: '90vh',
      data: { proveedorId: this.selectedProveedor?.id }
    });
    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.loadPage(this.currentPageIndex);
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

  prevPage(): void {
    if (this.page?.hasPrevious) {
      this.loadPage(this.currentPageIndex - 1);
    }
  }

  nextPage(): void {
    if (this.page?.hasNext) {
      this.loadPage(this.currentPageIndex + 1);
    }
  }

  updateComputedProperties(): void {}
}
