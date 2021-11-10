import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { WindowInfoService } from "./../services/window-info.service";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

@Component({
  selector: "app-report-test",
  templateUrl: "./report-test.component.html",
  styleUrls: ["./report-test.component.scss"],
})
export class ReportTestComponent implements OnInit {
  widthContainer: number = 300 / 1.2;
  heightContainer: number = 421 / 1.2;
  fontSize: number = 1;
  paginas = ["pagina 1", "pagina 2", "pagina 3"];
  selectedPagina;
  index = 0;

  @ViewChild("container")
  container!: ElementRef;

  constructor(private windowInfo: WindowInfoService) {}

  ngOnInit(): void {
    this.selectedPagina = this.paginas[this.index];
  }

  public downloadAsPDF() {
    let pdfData = new jsPDF("p", "mm", "a4");
    let data = this.container.nativeElement;
    let pages = []
    
    this.index = 0;
    for (let index = 0; index < this.paginas.length; index++) {
      this.index++;
      html2canvas(data as any).then((canvas) => {
        console.log(canvas)
        canvas.setAttribute('id', this.index.toString())
        const contentDataURL = canvas.toDataURL("image/png");
        pdfData.addPage();
        pdfData.addImage(contentDataURL, "PNG", 0, 0, 210, 295);
        if (this.index == this.paginas.length-1) {
          pdfData.save(`MyPdf.pdf`);
        }
      });
      console.log(index, this.index, this.paginas[this.index])
      
    }
  }

  zoomIn() {
    this.widthContainer = this.widthContainer * 1.1;
    this.heightContainer = this.heightContainer * 1.1;
    this.fontSize = this.fontSize * 1.1;
  }

  zoomOut() {
    this.widthContainer = this.widthContainer / 1.1;
    this.heightContainer = this.heightContainer / 1.1;
    this.fontSize = this.fontSize / 1.1;
  }

  paginaSiguiente() {
    this.selectedPagina = this.paginas[this.index++];
  }

  paginaAnterior() {
    this.selectedPagina = this.paginas[this.index--];
  }
}
