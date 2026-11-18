import { formatNumber } from '@angular/common';
import { Moneda } from '../../financiero/moneda/moneda.model';

/** Lo que hace falta de un item (de liquidacion o finiquito) para mostrar su moneda de origen. */
export interface ItemConMoneda {
  moneda?: Moneda;
  montoMoneda?: number;
  cotizacion?: number;
}

/** «Gs», «R$»: el simbolo, o la denominacion si la moneda no tiene. */
export function simboloMoneda(m?: Moneda): string {
  return m ? (m.simbolo?.trim() || m.denominacion || '') : '';
}

/** digitsInfo del pipe number para los montos de la moneda: guaranies sin decimales. */
export function digitosMoneda(m?: Moneda): string {
  const d = m?.decimales != null && m.decimales >= 0 ? m.decimales : (esGuarani(m) ? 0 : 2);
  return `1.${d}-${d}`;
}

function esGuarani(m?: Moneda): boolean {
  return !m || (m.denominacion || '').toUpperCase().includes('GUARAN');
}

/**
 * «R$ 110,00 · cot. 1.450» cuando el item vino de otra moneda que la del documento; null si no.
 * Su monto ya esta convertido: sin esto no se sabe de donde salio el numero. La cotizacion se muestra
 * siempre como «Gs por unidad» (el factor guardado es origen → documento, que en Gs → R$ da 0,00069).
 */
export function origenMonedaTexto(it: ItemConMoneda, doc?: Moneda): string | null {
  if (!it?.moneda || it.montoMoneda == null || !doc || it.moneda.id === doc.id) { return null; }
  const monto = formatNumber(it.montoMoneda, 'es-PY', digitosMoneda(it.moneda));
  const f = it.cotizacion;
  const cot = f != null && f > 0 ? ' · cot. ' + formatNumber(f >= 1 ? f : 1 / f, 'es-PY', '1.0-2') : '';
  return `${simboloMoneda(it.moneda)} ${monto}${cot}`;
}
