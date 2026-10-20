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
 *   Fuera de Electron (desktop servido como web) cae al PDF angosto en el visor (#231).
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
   *                 Ticket: `(58|80, true)` → payload ESC/POS (Electron);
   *                 `(58|80, false)` → PDF angosto (navegador).
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

  /**
   * PDF → visor integrado. `anchoMm` null = A4; 58/80 = ticket angosto (#231).
   * `aviso`, si viene, se muestra una vez abierto el visor.
   */
  private mostrarPdf(nombre: string, generar: (anchoMm: number | null, escpos: boolean) => Observable<any>,
                     anchoMm: number | null = null, aviso?: string): void {
    generar(anchoMm, false).pipe(take(1)).subscribe({
      next: (base64: string) => {
        if (!base64) {
          this.notificacion.notification$.next({ texto: 'No se pudo generar el documento', color: NotificacionColor.warn, duracion: 3 });
          return;
        }
        this.reporteService.onAdd(nombre, base64);
        this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, null));
        if (aviso) {
          this.notificacion.notification$.next({ texto: aviso, color: NotificacionColor.success, duracion: 8 });
        }
      },
      // Un solo manejo para todos los recibos y comprobantes que pasan por acá (#390).
      error: () => this.notificacion.notification$.next({ texto: 'No se pudo generar el documento: ' + nombre, color: NotificacionColor.warn, duracion: 4 }),
    });
  }

  /**
   * Ticket:
   * - En Electron → ESC/POS → impresora térmica local (printLocal), sin visor ni diálogo.
   * - En el navegador no hay printLocal (#231) → PDF angosto en el visor; se imprime con su
   *   botón, eligiendo la térmica en el diálogo del sistema.
   */
  private imprimirTicket(nombre: string, anchoMm: number, generar: (anchoMm: number | null, escpos: boolean) => Observable<any>): void {
    if (!this.electronService.isElectron) {
      this.mostrarPdf(nombre, generar, anchoMm,
        `Ticket ${anchoMm}mm listo: imprimilo con el botón del visor, eligiendo la térmica y papel de ${anchoMm}mm`);
      return;
    }
    // Buscar la impresora de ticket configurada.
    const avisarTicketNoGenerado = () => this.notificacion.notification$.next(
      { texto: 'No se pudo generar el ticket: ' + nombre + ' no se imprimió', color: NotificacionColor.warn, duracion: 5 });
    this.impresoraService.todas().pipe(take(1)).subscribe({ next: (impresoras: Impresora[]) => {
      if (impresoras == null) {
        // No es «no hay impresora configurada»: no se pudo leer la lista (#390).
        this.notificacion.notification$.next({ texto: 'No se pudieron leer las impresoras: el ticket no se imprimió', color: NotificacionColor.warn, duracion: 5 });
        return;
      }
      const imp = this.elegirImpresoraTicket(impresoras);
      if (!imp) {
        this.notificacion.notification$.next({ texto: 'No hay impresora de ticket configurada (Configuración → Impresoras)', color: NotificacionColor.warn, duracion: 5 });
        return;
      }
      generar(anchoMm, true).pipe(take(1)).subscribe({ next: (payloadBase64: string) => {
        if (!payloadBase64) {
          avisarTicketNoGenerado();
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
      }, error: avisarTicketNoGenerado });
    }, error: () => this.notificacion.notification$.next(
      { texto: 'No se pudieron leer las impresoras: el ticket no se imprimió', color: NotificacionColor.warn, duracion: 5 }) });
  }

  /** Impresora de ticket: uso TICKET (y tipo térmica), preferir la predeterminada. */
  private elegirImpresoraTicket(impresoras: Impresora[]): Impresora | null {
    const candidatas = (impresoras || []).filter(i => i.uso === 'TICKET' || i.tipo === 'TERMICA');
    if (!candidatas.length) { return null; }
    return candidatas.find(i => i.esPredeterminada) || candidatas[0];
  }
}
