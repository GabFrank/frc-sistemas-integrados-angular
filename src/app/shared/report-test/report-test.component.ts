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
  counter: number = 0;
  length: number
  pdf: jsPDF

  @ViewChild("container")
  container!: ElementRef;

  constructor(private windowInfo: WindowInfoService) {}

  ngOnInit(): void {
    this.selectedPagina = this.paginas[this.index];
  }

  downloadAsPDF() {
    this.pdf = new jsPDF('p', 'mm', 'a4') // A4 size page of PDF
    this.length = this.paginas.length
    this.counter = 0
    this.selectedPagina = this.paginas[this.counter]

    this.generatePDF()
 }

 generatePDF() {
  var data = document.getElementById('pdf' + this.counter)
  console.log(data)
  html2canvas(data, {
     scale: 3 // make better quality ouput
  }).then((canvas) => {
     this.counter++
     console.log(canvas)
     // Few necessary setting options
     const contentDataURL = canvas.toDataURL('image/png')
     console.log(contentDataURL)

     this.pdf.addImage(contentDataURL, 'PNG', 0, 0, 210, 295)

     // Control if new page needed, else generate the pdf
     console.log(this.counter, this.length)
     if (this.counter < this.length) {
       console.log('entro al if');
        this.pdf.addPage()
        this.generatePDF()
     } else {
       console.log('entra al save')
        this.pdf.save('users.pdf') // Generated PDF
        return true
     }
  })
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
    if(this.paginas.length-1 > this.counter) this.counter++;
    console.log(this.counter)

  }

  paginaAnterior() {
    if(this.counter > 0) this.counter--;
    console.log(this.counter)
  }
}
