import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { NgxExtendedPdfViewerService, pdfDefaultOptions } from "ngx-extended-pdf-viewer";
import { Subscription } from "rxjs";
import { ReporteData, ReporteService } from "../reporte.service";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionColor, NotificacionSnackbarService } from "../../../notificacion-snackbar.service";
import { anchoPxTicket, imprimirTicketEnNavegador } from "../../../shared/components/imprimir/imprimir-ticket-navegador";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-reportes",
  templateUrl: "./reportes.component.html",
  styleUrls: ["./reportes.component.scss"],
  providers: [NgxExtendedPdfViewerService]
})
export class ReportesComponent implements OnInit, OnDestroy {
  selectedBase64Pdf: string;
  filename: string;
  reporteList: ReporteData[];
  reporteSub: Subscription;
  currentPage: number;
  selectedReporte: ReporteData;
  imprimiendoTicket = false;

  constructor(
    private reporteService: ReporteService,
    private pdfViewerService: NgxExtendedPdfViewerService,
    private notificacion: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.reporteList = [];
    this.reporteSub = this.reporteService.sub.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null && res.length > 0) {
        this.reporteList = res;
        this.onSelectReporte(
          this.reporteList[this.reporteList.length - 1],
          this.reporteList.length - 1
        );
      }
    });
  }

  onSelectReporte(reporte: ReporteData, i) {
    this.selectedReporte = reporte;
    if (this.reporteList && this.reporteList[i]) {
      this.reporteList[i].currentPage = this.currentPage;
    }
  }

  onClose(i) {
    this.reporteService.onRemove(i);
    if (this.reporteList && this.reporteList.length > 0) {
      this.onSelectReporte(this.reporteList[this.reporteList.length - 1], i);
    }
  }
  /**
   * Ticket abierto desde el navegador (#231): se imprime como imagen, sin el botón del visor,
   * para que la térmica empiece desde arriba del rollo (ver imprimir-ticket-navegador.ts).
   */
  async onImprimirTicket() {
    const anchoMm = this.selectedReporte?.anchoMm;
    if (!anchoMm || this.imprimiendoTicket) { return; }
    this.imprimiendoTicket = true;
    try {
      const total = this.pdfViewerService.numberOfPages();
      const paginas: string[] = [];
      for (let p = 1; p <= total; p++) {
        paginas.push(await this.pdfViewerService.getPageAsImage(p, { width: anchoPxTicket(anchoMm) }, '#FFFFFF'));
      }
      if (!paginas.length || paginas.some(src => !src)) { throw new Error('ticket sin páginas'); }
      await imprimirTicketEnNavegador(paginas);
    } catch (e) {
      this.notificacion.notification$.next({ texto: 'No se pudo imprimir el ticket', color: NotificacionColor.warn, duracion: 4 });
    } finally {
      this.imprimiendoTicket = false;
    }
  }

  openInBrowser(reporte: ReporteData) {
    // window.
    window.alert('Todavia no funciona este kp')
  }

  ngOnDestroy(): void {
    this.reporteSub.unsubscribe();
    this.reporteService.clearAll();
  }
}
