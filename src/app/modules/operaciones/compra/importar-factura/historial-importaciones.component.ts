import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { GestionComprasComponent } from '../gestion-compras/gestion-compras.component';
import { ImportarFacturaComponent } from './importar-factura.component';
import { FacturaImportService } from './factura-import.service';
import { ESTADO_IMPORT, FacturaProveedorImport } from './factura-import.model';

@UntilDestroy()
@Component({
  selector: 'app-historial-importaciones',
  templateUrl: './historial-importaciones.component.html',
  styleUrls: ['./historial-importaciones.component.scss'],
})
export class HistorialImportacionesComponent implements OnInit {
  estados = ['', 'REVISION_PENDIENTE', 'CONFIRMADO', 'ERROR', 'PROCESANDO'];
  estadoSeleccionado = '';

  data: FacturaProveedorImport[] = [];
  page = 0;
  size = 20;
  totalElements = 0;

  displayedColumns = ['id', 'creadoEn', 'origen', 'nombreArchivo', 'estado', 'modeloIa', 'acciones'];
  ESTADO = ESTADO_IMPORT;

  constructor(
    private importService: FacturaImportService,
    private tabService: TabService,
    private notif: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.importService
      .listar(this.estadoSeleccionado || null, this.page, this.size)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (pageRes) => {
          this.data = pageRes?.getContent || [];
          this.totalElements = pageRes?.getTotalElements || 0;
        },
        error: () => this.notif.openAlgoSalioMal('Error al cargar el historial'),
      });
  }

  onEstadoChange(): void {
    this.page = 0;
    this.cargar();
  }

  onPage(event: any): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.cargar();
  }

  abrir(row: FacturaProveedorImport): void {
    if (row.estado === ESTADO_IMPORT.REVISION_PENDIENTE) {
      this.tabService.addTab(
        new Tab(
          ImportarFacturaComponent,
          'Importar #' + row.id,
          new TabData(row.id),
          HistorialImportacionesComponent,
        ),
      );
    } else if (row.estado === ESTADO_IMPORT.CONFIRMADO && row.pedidoId) {
      this.tabService.addTab(
        new Tab(
          GestionComprasComponent,
          'Pedido ' + row.pedidoId,
          new TabData(row.pedidoId),
          HistorialImportacionesComponent,
        ),
      );
    } else if (row.estado === ESTADO_IMPORT.ERROR) {
      this.notif.openWarn(row.errorMensaje || 'La importación falló');
    } else {
      this.notif.openWarn('Importación en estado ' + row.estado);
    }
  }

  estadoClass(estado: string): string {
    switch (estado) {
      case ESTADO_IMPORT.CONFIRMADO:
        return 'success';
      case ESTADO_IMPORT.REVISION_PENDIENTE:
        return 'warn';
      case ESTADO_IMPORT.ERROR:
        return 'danger';
      default:
        return 'info';
    }
  }

  nuevaImportacion(): void {
    this.tabService.addTab(new Tab(ImportarFacturaComponent, 'Importar Factura', null, null));
  }

  trackById(index: number, row: FacturaProveedorImport): number {
    return row.id;
  }
}
