import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { NgxExtendedPdfViewerService, pdfDefaultOptions } from "ngx-extended-pdf-viewer";
import { Subscription } from "rxjs";
import { ReporteData, ReporteService } from "../reporte.service";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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

  constructor(private reporteService: ReporteService) {

  }

  ngOnInit(): void {
    this.reporteList = [];
    this.reporteSub = this.reporteService.sub.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
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
    this.reporteList[i].currentPage = this.currentPage;
    console.log(this.reporteList);
  }

  onClose(i) {
    this.reporteService.onRemove(i);
    if (this.reporteList.length > 0) {
      this.onSelectReporte(this.reporteList[this.reporteList.length - 1], i);
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
