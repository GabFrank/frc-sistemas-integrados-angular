import { Component, Input } from '@angular/core';

/**
 * Moneda mínima que necesita el componente para decidir el tooltip.
 * id 1 = GUARANI (moneda base). Cualquier otro id con cotización > 1 se considera extranjera.
 */
export interface CostoDisplayMoneda {
  id?: number | null;
  simbolo?: string | null;
  denominacion?: string | null;
}

/**
 * Display unificado de un precio de costo. SIEMPRE muestra el valor en guaraníes (moneda base),
 * porque así se persiste en `costo_por_producto` (tanto `costoMedio` como `ultimoPrecioCompra`).
 *
 * Si el costo proviene de una compra en moneda extranjera (moneda != GUARANI y cotización > 1),
 * agrega un ícono sutil y un matTooltip con el valor en la moneda original, derivado como
 * `valorGs / cotizacion`. No se guarda el valor crudo original: se reconstruye desde la cotización.
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
export class CostoDisplayComponent {
  /** Valor del costo en guaraníes. */
  @Input() valor: number | null | undefined;

  /** Moneda original de la compra (opcional). Si es null/GUARANI no se muestra tooltip. */
  @Input() moneda: CostoDisplayMoneda | null | undefined;

  /** Cotización de la moneda original respecto al guaraní. > 1 dispara el tooltip. */
  @Input() cotizacion: number | null | undefined;

  /** Formato del DecimalPipe para el valor en Gs. */
  @Input() digitos = '1.0-0';

  /** Sufijo mostrado tras el número. */
  @Input() sufijo = 'Gs.';

  /** Texto cuando no hay valor (p.ej. sin permiso de ver costos, o producto sin costo). */
  @Input() placeholder = '-';

  get tieneValor(): boolean {
    return this.valor != null;
  }

  /** Verdadero solo si hay info suficiente y la compra fue en moneda extranjera. */
  get esExtranjera(): boolean {
    return (
      this.tieneValor &&
      this.moneda != null &&
      this.moneda.id != null &&
      this.moneda.id !== 1 &&
      this.cotizacion != null &&
      this.cotizacion > 1
    );
  }

  /** Valor reconstruido en la moneda original: valorGs / cotizacion. */
  get valorOriginal(): number | null {
    if (!this.esExtranjera) {
      return null;
    }
    return this.valor! / this.cotizacion!;
  }

  get tooltip(): string {
    if (!this.esExtranjera) {
      return '';
    }
    const simbolo = this.moneda?.simbolo ?? this.moneda?.denominacion ?? '';
    const original = this.valorOriginal!.toLocaleString('es-PY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const cotiz = this.cotizacion!.toLocaleString('es-PY');
    return `${simbolo} ${original} · cotiz. ${cotiz}`.trim();
  }
}
