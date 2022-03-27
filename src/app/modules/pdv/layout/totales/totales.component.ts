import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-totales',
  templateUrl: './totales.component.html',
  styleUrls: ['./totales.component.scss']
})
export class TotalesComponent implements OnInit {
  totalGs;
  cambioRs;
  cambioDs;
  cambioArg;
  constructor() { }

  ngOnInit(): void {
  }

}
