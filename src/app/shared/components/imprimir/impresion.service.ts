import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Tab } from '../../../layouts/tab/tab.model';
import { TabService } from '../../../layouts/tab/tab.service';
import { ReporteService } from '../../../modules/reportes/reporte.service';
import { ReportesComponent } from '../../../modules/reportes/reportes/reportes.component';
import { NotificacionSnackbarService, NotificacionColor } from '../../../notificacion-snackbar.service';
import { ElectronService } from '../../../commons/core/electron/electron.service';
import { ImpresoraService } from '../../../modules/configuracion/impresoras/impresora.service';
import { Impresora } from '../../../modules/configuracion/impresoras/impresora.model';
import { ImprimirDialogComponent, ImprimirDialogResult } from './imprimir-dialog.component';

/**
 * Servicio OFICIAL de impresión. Abre el diálogo de formato (PDF / Ticket):
 * - **PDF (A4)**: genera el PDF y lo muestra en el visor integrado.
 * - **Ticket (58/80mm)**: genera el payload **ESC/POS** y lo imprime en la impresora
 *   térmica local del cliente vía `printLocal` (`lp -o raw`, sin conversión a PostScript).
 * Padrón del sistema para recibos/comprobantes.
 */
@Injectable({ providedIn: 'root' })
export class ImpresionService {
  constructor(
    private dialog: MatDialog,
    private tabService: TabService,
    private reporteService: ReporteService,
    private notificacion: NotificacionSnackbarService,
    private electronService: ElectronService,
    private impresoraService: ImpresoraService
  ) {}

  /**
   * @param nombre   nombre del documento (visor / notificación).
   * @param generar  `(anchoMm, escpos) => Observable<base64>`. PDF: `(null, false)`.
   *                 Ticket: `(58|80, true)` → payload ESC/POS.
   * @param soloPdf  si true, el diálogo no ofrece ticket.
   */
  imprimir(nombre: string, generar: (anchoMm: number | null, escpos: boolean) => Observable<any>, soloPdf = false): void {
    this.dialog.open(ImprimirDialogComponent, { width: '380px', data: { titulo: 'Imprimir', soloPdf } })
      .afterClosed().pipe(take(1)).subscribe((res: ImprimirDialogResult | undefined) => {
        if (!res) { return; }
        if (res.formato === 'ticket' && res.anchoMm) {
          this.imprimirTicket(nombre, res.anchoMm, generar);
        } else {
          this.mostrarPdf(nombre, generar);
        }
      });
  }

  /** PDF A4 → visor integrado. */
  private mostrarPdf(nombre: string, generar: (anchoMm: number | null, escpos: boolean) => Observable<any>): void {
    generar(null, false).pipe(take(1)).subscribe((base64: string) => {
      if (!base64) {
        this.notificacion.notification$.next({ texto: 'No se pudo generar el documento', color: NotificacionColor.warn, duracion: 3 });
        return;
      }
      this.reporteService.onAdd(nombre, base64);
      this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, null));
    });
  }

  /** Ticket → ESC/POS → impresora térmica local (printLocal). */
  private imprimirTicket(nombre: string, anchoMm: number, generar: (anchoMm: number | null, escpos: boolean) => Observable<any>): void {
    if (!this.electronService.isElectron) {
      this.notificacion.notification$.next({ texto: 'La impresión de ticket requiere la app de escritorio', color: NotificacionColor.warn, duracion: 4 });
      return;
    }
    // Buscar la impresora de ticket configurada.
    this.impresoraService.todas().pipe(take(1)).subscribe((impresoras: Impresora[]) => {
      const imp = this.elegirImpresoraTicket(impresoras);
      if (!imp) {
        this.notificacion.notification$.next({ texto: 'No hay impresora de ticket configurada (Configuración → Impresoras)', color: NotificacionColor.warn, duracion: 5 });
        return;
      }
      generar(anchoMm, true).pipe(take(1)).subscribe((payloadBase64: string) => {
        if (!payloadBase64) {
          this.notificacion.notification$.next({ texto: 'No se pudo generar el ticket', color: NotificacionColor.warn, duracion: 3 });
          return;
        }
        this.electronService.printLocal({
          conexion: imp.conexion, cola: imp.colaCups, ip: imp.ip, puerto: imp.puerto, payloadBase64,
        }).pipe(take(1)).subscribe({
          next: (r) => this.notificacion.notification$.next(
            r?.success
              ? { texto: nombre + ' enviado a ' + imp.nombre, color: NotificacionColor.success, duracion: 3 }
              : { texto: 'No se pudo imprimir: ' + (r?.error || 'error'), color: NotificacionColor.warn, duracion: 5 }),
          error: () => this.notificacion.notification$.next({ texto: 'Error al imprimir el ticket', color: NotificacionColor.warn, duracion: 4 }),
        });
      });
    });
  }

  /** Impresora de ticket: uso TICKET (y tipo térmica), preferir la predeterminada. */
  private elegirImpresoraTicket(impresoras: Impresora[]): Impresora | null {
    const candidatas = (impresoras || []).filter(i => i.uso === 'TICKET' || i.tipo === 'TERMICA');
    if (!candidatas.length) { return null; }
    return candidatas.find(i => i.esPredeterminada) || candidatas[0];
  }
}
