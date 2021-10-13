import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import html2canvas from 'html2canvas';
import { PrintService } from '../print.service';

@Component({
  selector: 'app-print-design',
  templateUrl: './print-design.component.html',
  styleUrls: ['./print-design.component.scss']
})
export class PrintDesignComponent implements OnInit {

  @ViewChild('ticket1', {static: false}) ticket: ElementRef;

  constructor(
    private printService: PrintService
  ) { }

  ngOnInit(): void {
  }

  onPrint(){
    html2canvas(this.ticket.nativeElement).then((canvas)=>{
      let image = canvas.toDataURL('image/png');
      this.printService.print(image);
    })
  }

}
