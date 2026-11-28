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
import { ConfiguracionService } from '../../services/configuracion.service';

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
    private impresoraService: ImpresoraService,
    private configuracionService: ConfiguracionService,
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
   * Ticket directo a la térmica, sin el diálogo de formato: comprobantes que se presillan a un documento (cheque
   * anulado, #807). El ancho es el de la impresora de ticket (80 si es de 72/80 mm; si no, 58). Solo en la app de
   * escritorio: en el navegador no hay impresión local y se avisa.
   */
  imprimirTicketDirecto(nombre: string, generar: (anchoMm: number) => Observable<any>): void {
    if (!this.electronService.isElectron) {
      this.notificacion.notification$.next({
        texto: nombre + ': el ticket se imprime desde la app de escritorio.', color: NotificacionColor.warn, duracion: 6 });
      return;
    }
    this.imprimirTicket(nombre, null, (anchoMm) => generar(anchoMm));
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
        this.reporteService.onAdd(nombre, base64, anchoMm);
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
  private imprimirTicket(nombre: string, anchoMm: number | null, generar: (anchoMm: number | null, escpos: boolean) => Observable<any>): void {
    if (!this.electronService.isElectron) {
      this.mostrarPdf(nombre, generar, anchoMm,
        `Ticket ${anchoMm}mm listo: usá «Imprimir ticket» y elegí la térmica`);
      return;
    }
    // La impresora de esta PC (Configuración → Impresora local) manda: las del registro del central son de todas las
    // sucursales y su cola puede no existir acá (`lp`: «The printer or class does not exist»).
    const local = this.configuracionService.getConfig()?.impresoraLocal;
    if (local?.cola) {
      this.enviarTicket(nombre, anchoMm ?? this.anchoDePerfil(local.perfil), generar,
        { nombre: local.nombre || local.cola, conexion: local.conexion, cola: local.cola });
      return;
    }
    // Sin impresora local: la de ticket del registro, como antes.
    this.impresoraService.todas().pipe(take(1)).subscribe({ next: (impresoras: Impresora[]) => {
      if (impresoras == null) {
        // No es «no hay impresora configurada»: no se pudo leer la lista (#390).
        this.notificacion.notification$.next({ texto: 'No se pudieron leer las impresoras: el ticket no se imprimió', color: NotificacionColor.warn, duracion: 5 });
        return;
      }
      const imp = this.elegirImpresoraTicket(impresoras);
      if (!imp) {
        this.notificacion.notification$.next({ texto: 'No hay impresora de ticket configurada en esta PC (Configuración → Impresora local)', color: NotificacionColor.warn, duracion: 5 });
        return;
      }
      this.enviarTicket(nombre, anchoMm ?? this.anchoDe(imp), generar,
        { nombre: imp.nombre, conexion: imp.conexion, cola: imp.colaCups, ip: imp.ip, puerto: imp.puerto });
    }, error: () => this.notificacion.notification$.next(
      { texto: 'No se pudieron leer las impresoras: el ticket no se imprimió', color: NotificacionColor.warn, duracion: 5 }) });
  }

  /** Genera el ESC/POS con `anchoMm` y lo manda a `destino` por `printLocal`. */
  private enviarTicket(nombre: string, anchoMm: number, generar: (anchoMm: number | null, escpos: boolean) => Observable<any>,
                       destino: { nombre: string; conexion: string; cola?: string; ip?: string; puerto?: number }): void {
    const avisarTicketNoGenerado = () => this.notificacion.notification$.next(
      { texto: 'No se pudo generar el ticket: ' + nombre + ' no se imprimió', color: NotificacionColor.warn, duracion: 5 });
    generar(anchoMm, true).pipe(take(1)).subscribe({ next: (payloadBase64: string) => {
      if (!payloadBase64) {
        avisarTicketNoGenerado();
        return;
      }
      this.electronService.printLocal({
        conexion: destino.conexion, cola: destino.cola, ip: destino.ip, puerto: destino.puerto, payloadBase64,
      }).pipe(take(1)).subscribe({
        next: (r) => this.notificacion.notification$.next(
          r?.success
            ? { texto: nombre + ' enviado a ' + destino.nombre, color: NotificacionColor.success, duracion: 3 }
            : { texto: 'No se pudo imprimir en ' + destino.nombre + ': ' + (r?.error || 'error'), color: NotificacionColor.warn, duracion: 5 }),
        error: () => this.notificacion.notification$.next({ texto: 'Error al imprimir el ticket', color: NotificacionColor.warn, duracion: 4 }),
      });
    }, error: avisarTicketNoGenerado });
  }

  /** Ancho de la impresora local según su perfil: 80 para 72/80 mm, 58 para el resto. */
  private anchoDePerfil(perfil: string | null | undefined): number {
    return perfil === 'MM_80' || perfil === 'MM_72' ? 80 : 58;
  }

  /** 80 mm si la impresora es de 72/80 mm; si no, 58. */
  private anchoDe(imp: Impresora): number {
    return (imp.anchoMm || 0) >= 72 || imp.perfilPapel === 'MM_80' || imp.perfilPapel === 'MM_72' ? 80 : 58;
  }

  /** Impresora de ticket: uso TICKET (y tipo térmica), preferir la predeterminada. */
  private elegirImpresoraTicket(impresoras: Impresora[]): Impresora | null {
    const candidatas = (impresoras || []).filter(i => i.uso === 'TICKET' || i.tipo === 'TERMICA');
    if (!candidatas.length) { return null; }
    return candidatas.find(i => i.esPredeterminada) || candidatas[0];
  }
}
