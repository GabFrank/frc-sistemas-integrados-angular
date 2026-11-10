import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-totales',
  templateUrl: './totales.component.html',
  styleUrls: ['./totales.component.scss']
})
export class TotalesComponent implements OnInit {
  @Input() totalGs;
  @Input() descuentoGs;
  @Input() cambioRs;
  @Input() cambioDs;
  @Input() cambioArg;
  /**
   * Moneda del PDV (Fase 4). Los valores por defecto son los de siempre (guaraníes, sin decimales): con la
   * moneda del PDV igual a la de la empresa nadie los toca. En ese caso `cambioRs` / `cambioDs` son los cambios
   * del comercio; con otra moneda del PDV, cuántas unidades de ella vale 1 R$ / 1 US$.
   */
  @Input() simbolo = 'Gs.';
  /** Formato del número principal (digitsInfo de `number`); sin definir = el de siempre. */
  @Input() formato: string;
  @Input() bandera: string | null = 'assets/flags/py/py64.png';
  /** El total llevado a la moneda de la empresa; solo con otra moneda del PDV. */
  @Input() totalEquivalente: number | null = null;
  @Input() simboloEquivalente = '';
  @Input() formatoEquivalente: string;
  constructor() { }

  ngOnInit(): void {
  }

}
