import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Tab } from '../../../layouts/tab/tab.model';
import { TabService } from '../../../layouts/tab/tab.service';
import { ReporteService } from '../../../modules/reportes/reporte.service';
import { ReportesComponent } from '../../../modules/reportes/reportes/reportes.component';
import { NotificacionSnackbarService, NotificacionColor } from '../../../notificacion-snackbar.service';
import { ImprimirDialogComponent, ImprimirDialogResult } from './imprimir-dialog.component';

/**
 * Servicio OFICIAL de impresión. Abre el diálogo de formato (PDF / Ticket), y con
 * la elección llama al generador (que devuelve el PDF en base64 en el ancho pedido)
 * y lo muestra en el visor integrado. Padrón del sistema para recibos/comprobantes.
 */
@Injectable({ providedIn: 'root' })
export class ImpresionService {
  constructor(
    private dialog: MatDialog,
    private tabService: TabService,
    private reporteService: ReporteService,
    private notificacion: NotificacionSnackbarService
  ) {}

  /**
   * @param nombre     nombre del documento en el visor
   * @param generar    (anchoMm) => Observable<base64>. anchoMm null = PDF A4; 58/80 = ticket.
   * @param soloPdf    si true, no ofrece ticket (solo PDF)
   */
  imprimir(nombre: string, generar: (anchoMm: number | null) => Observable<any>, soloPdf = false): void {
    this.dialog.open(ImprimirDialogComponent, { width: '380px', data: { titulo: 'Imprimir', soloPdf } })
      .afterClosed().pipe(take(1)).subscribe((res: ImprimirDialogResult | undefined) => {
        if (!res) { return; }
        generar(res.anchoMm).pipe(take(1)).subscribe((base64: string) => {
          if (!base64) {
            this.notificacion.notification$.next({ texto: 'No se pudo generar el documento', color: NotificacionColor.warn, duracion: 3 });
            return;
          }
          const sufijo = res.anchoMm ? ' (ticket ' + res.anchoMm + 'mm)' : '';
          this.reporteService.onAdd(nombre + sufijo, base64);
          this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, null));
        });
      });
  }
}
