import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormControlName } from '@angular/forms';
import html2canvas from 'html2canvas';
import { printVale } from '../graphql/graphql-query';
import { PrintService } from '../print.service';

export class PrintTicketFiestaData {
  cantidad: number;
  vale: number;
  nombre: string;
}

@Component({
  selector: 'app-print-tickets',
  templateUrl: './print-tickets.component.html',
  styleUrls: ['./print-tickets.component.scss']
})
export class PrintTicketsComponent implements OnInit {

  @ViewChild('ticket') ticket: ElementRef;
  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('downloadLink') downloadLink: ElementRef;
  @ViewChild('ticket2') ticket2: ElementRef;
  @ViewChild('canvas2') canvas2: ElementRef;
  @ViewChild('downloadLink2') downloadLink2: ElementRef;


  cantidad: number;
  vale: number;
  nombre: string;

  constructor(
    private printService: PrintService
  ) { }

  ngOnInit(): void {
  }

  cantidadControl = new FormControl();
  valeControl = new FormControl();
  nombreControl = new FormControl();

  onImprimir(){
    let vale = new PrintTicketFiestaData;
    vale.cantidad = this.cantidadControl.value;
    vale.vale = this.valeControl.value;
    vale.nombre = this.nombreControl.value;
    this.downloadImage()
  }

  onImprimir2(){
    this.downloadImage2()
  }

  downloadImage(){
    html2canvas(this.ticket.nativeElement).then(canvas => {
      let image = canvas.toDataURL("image/jpeg").split(';base64,')[1];
      this.printService.print(canvas.toDataURL('image/png').split(';base64,')[1]);
      this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
      this.downloadLink.nativeElement.download = 'marble-diagram.png';
      this.downloadLink.nativeElement.click();
    });
  }

  downloadImage2(){
    html2canvas(this.ticket2.nativeElement).then(canvas2 => {
      let image = canvas2.toDataURL("image/jpeg").split(';base64,')[1];
      this.printService.print(canvas2.toDataURL('image/png').split(';base64,')[1]);
      this.downloadLink2.nativeElement.href = canvas2.toDataURL('image/png');
      this.downloadLink2.nativeElement.download = 'ticket.png';
      this.downloadLink2.nativeElement.click();
    });
  }

}
