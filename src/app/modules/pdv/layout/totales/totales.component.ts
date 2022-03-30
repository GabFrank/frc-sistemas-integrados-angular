import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-totales',
  templateUrl: './totales.component.html',
  styleUrls: ['./totales.component.scss']
})
export class TotalesComponent implements OnInit {
  @Input() totalGs;
  @Input() cambioRs;
  @Input() cambioDs;
  @Input() cambioArg;
  constructor() { }

  ngOnInit(): void {
  }

}
