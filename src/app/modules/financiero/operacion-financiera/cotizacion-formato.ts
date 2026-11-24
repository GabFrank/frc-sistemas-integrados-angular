import { Moneda } from '../moneda/moneda.model';

/**
 * Cotización de un cambio de divisa en formato de casa de cambio (central #603, desk #720): unidades de la moneda de
 * menor valor por 1 de la de mayor valor (1 US$ = 5,60 R$; 1 US$ = 6.400 Gs).
 *
 * Misma regla que `CotizacionNormalizada` del central, para que se lea bien aunque la operación la haya guardado un
 * central anterior con la cotización al revés: la moneda mayor es la de monto menor; la cotización guardada se usa si
 * cierra con los montos (±1 %), invertida si cierra invertida, y si no, la de los montos.
 */
export interface CotizacionLegible {
  mayor: Moneda;
  menor: Moneda;
  /** «menor por 1 mayor». */
  valor: number;
  /** «5,60 R$ por 1 US$». */
  texto: string;
  /** «= 0,1786 US$ por 1 R$». */
  inversa: string;
}

const TOLERANCIA = 0.01;

export function cotizacionLegible(montoOrigen: number, monedaOrigen: Moneda, montoDestino: number, monedaDestino: Moneda,
                                  cotizacion: number | null): CotizacionLegible | null {
  if (!(montoOrigen > 0) || !(montoDestino > 0) || !monedaOrigen || !monedaDestino) return null;
  const mayorEsOrigen = montoOrigen <= montoDestino;
  const mayor = mayorEsOrigen ? monedaOrigen : monedaDestino;
  const menor = mayorEsOrigen ? monedaDestino : monedaOrigen;
  const deLosMontos = Math.max(montoOrigen, montoDestino) / Math.min(montoOrigen, montoDestino);
  const cierra = (c: number) => Math.abs(c - deLosMontos) <= deLosMontos * TOLERANCIA;
  let valor = deLosMontos;
  if (cotizacion > 0 && cierra(cotizacion)) valor = cotizacion;
  else if (cotizacion > 0 && cierra(1 / cotizacion)) valor = 1 / cotizacion;
  return {
    mayor, menor, valor,
    texto: `${formatear(valor)} ${menor.simbolo} por 1 ${mayor.simbolo}`,
    inversa: `= ${formatear(1 / valor, 4)} ${mayor.simbolo} por 1 ${menor.simbolo}`,
  };
}

/** Formato PY: miles con punto y decimales con coma; hasta `maxDecimales`, sin ceros de más. */
export function formatear(v: number, maxDecimales = 6): string {
  const decimales = Math.abs(v) >= 100 ? 2 : maxDecimales;
  return v.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: decimales });
}
