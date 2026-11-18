import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MonedaModuloService } from '../../services/moneda-modulo.service';

/**
 * Moneda mínima que necesita el componente para decidir el tooltip.
 * Es «la moneda de la empresa» la que coincide con `MonedaModuloService.empresa$`; cualquier otra con
 * cotización > 1 se considera extranjera.
 */
export interface CostoDisplayMoneda {
  id?: number | null;
  simbolo?: string | null;
  denominacion?: string | null;
  decimales?: number | null;
}

/**
 * Display unificado de un precio de costo. Muestra el valor en la moneda de la empresa (en guaraníes
 * para el sistema de siempre), porque así se persiste en `costo_por_producto` (tanto `costoMedio` como
 * `ultimoPrecioCompra`). Si se pasan `valorCosteo` y `monedaCosteo` (el costo en la moneda de costeo),
 * muestra ese valor con el símbolo y los decimales de esa moneda.
 *
 * Si el costo proviene de una compra en otra moneda (distinta de la de la empresa y cotización > 1),
 * agrega un ícono sutil y un matTooltip con el valor en la moneda original, derivado como
 * `valor / cotizacion`. No se guarda el valor crudo original: se reconstruye desde la cotización.
 *
 * Uso típico:
 *   <app-costo-display [valor]="producto?.costo?.costoMedio"></app-costo-display>
 *   <app-costo-display [valor]="producto?.costo?.ultimoPrecioCompra"
 *                      [moneda]="producto?.costo?.moneda"
 *                      [cotizacion]="producto?.costo?.cotizacion"></app-costo-display>
 *
 * Este componente es el ÚNICO lugar donde se decide cómo se pinta un costo: si en el futuro
 * cambia la semántica de almacenamiento, se ajusta acá y no en cada template.
 */
@Component({
  selector: 'app-costo-display',
  templateUrl: './costo-display.component.html',
  styleUrls: ['./costo-display.component.scss'],
})
export class CostoDisplayComponent implements OnInit, OnChanges, OnDestroy {
  /** Valor del costo en la moneda de la empresa. */
  @Input() valor: number | null | undefined;

  /** Moneda original de la compra (opcional). Si es null o la de la empresa no se muestra tooltip. */
  @Input() moneda: CostoDisplayMoneda | null | undefined;

  /** Cotización de la moneda original respecto a la de la empresa. > 1 dispara el tooltip. */
  @Input() cotizacion: number | null | undefined;

  /** Costo en la moneda de costeo (opcional): si viene con `monedaCosteo`, se muestra este valor. */
  @Input() valorCosteo: number | null | undefined;

  /** Moneda de costeo de `valorCosteo`. */
  @Input() monedaCosteo: CostoDisplayMoneda | null | undefined;

  /** Formato del DecimalPipe. Sin él: el de la moneda mostrada (la de la empresa, 0 decimales en guaraníes). */
  @Input() digitos: string | null | undefined;

  /** Sufijo mostrado tras el número. Sin él: el símbolo de la moneda mostrada («Gs.» en guaraníes). */
  @Input() sufijo: string | null | undefined;

  /** Texto cuando no hay valor (p.ej. sin permiso de ver costos, o producto sin costo). */
  @Input() placeholder = '-';

  // Calculadas en ngOnChanges: el template no ejecuta getters en cada ciclo.
  tieneValor = false;
  valorMostrado: number | null = null;
  digitosMostrados = '1.0-0';
  sufijoMostrado = 'Gs.';
  /** Verdadero solo si hay info suficiente y la compra fue en otra moneda que la de la empresa. */
  esExtranjera = false;
  tooltip = '';

  private empresaSub?: Subscription;

  constructor(private monedaModuloService: MonedaModuloService) {}

  ngOnInit(): void {
    // La moneda de la empresa puede resolverse después de pintar el componente
    this.empresaSub = this.monedaModuloService.empresa$.subscribe(() => this.calcular());
  }

  ngOnChanges(): void {
    this.calcular();
  }

  ngOnDestroy(): void {
    this.empresaSub?.unsubscribe();
  }

  private calcular(): void {
    const costeo = this.monedaCosteo != null && this.valorCosteo != null
      && !this.monedaModuloService.esMonedaEmpresa(this.monedaCosteo);
    const monedaMostrada: CostoDisplayMoneda | null = costeo ? this.monedaCosteo! : this.monedaModuloService.empresa$.value;

    this.tieneValor = (costeo ? this.valorCosteo : this.valor) != null;
    this.valorMostrado = (costeo ? this.valorCosteo : this.valor) ?? null;

    const decimales = monedaMostrada?.decimales ?? 0;
    // El costo de costeo se guarda con al menos 4 decimales (central CosteoMoneda.DECIMALES_COSTO):
    // los de la moneda siempre, y hasta 4 si los trae (0,4014 US$, no 0,4).
    this.digitosMostrados = this.digitos ?? (costeo
      ? `1.${decimales}-${Math.max(decimales, 4)}`
      : (decimales > 0 ? `1.0-${decimales}` : '1.0-0'));
    const simboloMoneda = monedaMostrada?.denominacion && monedaMostrada.denominacion.toUpperCase().includes('GUARANI')
      ? 'Gs.'
      : (monedaMostrada?.simbolo || 'Gs.');
    this.sufijoMostrado = this.sufijo ?? simboloMoneda;

    this.esExtranjera =
      !costeo &&
      this.tieneValor &&
      this.moneda != null &&
      this.moneda.id != null &&
      !this.monedaModuloService.esMonedaEmpresa(this.moneda) &&
      this.cotizacion != null &&
      this.cotizacion > 1;

    if (!this.esExtranjera) {
      this.tooltip = '';
      return;
    }
    const simbolo = this.moneda?.simbolo ?? this.moneda?.denominacion ?? '';
    const original = (this.valor! / this.cotizacion!).toLocaleString('es-PY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const cotiz = this.cotizacion!.toLocaleString('es-PY');
    this.tooltip = `${simbolo} ${original} · cotiz. ${cotiz}`.trim();
  }
}
