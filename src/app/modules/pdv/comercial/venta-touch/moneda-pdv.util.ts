import {
  cotizacionEntreMonedas,
  redondearMonto,
} from "../../../productos/precio-por-sucursal/precio-moneda.util";

/**
 * Aritmética del PDV en la moneda del PDV (Fase 4 — PDV en otra moneda).
 *
 * Vocabulario (nada acá nombra una moneda concreta):
 *  - «empresa» (principal): la moneda en que la empresa lleva sus libros. `venta.totalGs`, `venta_item.precio`
 *    y `cobro.totalGs` siguen siempre en ella (el «equivalente»).
 *  - «base» (moneda del PDV): la moneda en que se arma y se cobra la venta en esa sucursal.
 *  - `Moneda.cambio`: unidades de la moneda de la empresa HISTÓRICA (el guaraní) por unidad de la moneda. Se lo
 *    trata como «unidades de la empresa por unidad», dividiendo por el `cambio` de la empresa (1 si falta).
 *
 * Con base == empresa (toda instalación actual) estas funciones dan exactamente lo de siempre: factor 1,
 * cotización 1, redondeo con 0 decimales = `Math.round`.
 *
 * Funciones puras, sin Angular.
 */

/** Lo mínimo que se necesita de una moneda. */
export interface MonedaPdv {
  id?: number | string | null;
  cambio?: number | null;
  decimales?: number | null;
}

function mismaMoneda(a: MonedaPdv | null | undefined, b: MonedaPdv | null | undefined): boolean {
  return a?.id != null && b?.id != null && String(a.id) === String(b.id);
}

function decimalesDe(moneda: MonedaPdv | null | undefined): number {
  const d = moneda?.decimales;
  return d != null && isFinite(d) && d > 0 ? Math.floor(d) : 0;
}

/**
 * Redondea un monto a `decimales`, HALF_UP. Con 0 decimales es `Math.round` (lo que hacía el PDV);
 * con decimales redondea sobre la representación decimal exacta (sin el 1.005 → 1.00 del flotante).
 */
export function redondear(monto: number, decimales: number | null | undefined): number {
  const d = decimales != null && isFinite(decimales) && decimales > 0 ? Math.floor(decimales) : 0;
  if (d === 0) return Math.round(monto);
  return redondearMonto(monto, d) ?? NaN;
}

/** Redondea a los decimales de una moneda. */
export function redondearEnMoneda(monto: number, moneda: MonedaPdv | null | undefined): number {
  return redondear(monto, decimalesDe(moneda));
}

/**
 * Unidades de la empresa por 1 unidad de `moneda`. 1 si es la misma moneda de la empresa; null si no se sabe
 * (sin `cambio`, o <= 0): quien lo pide no puede vender ni cobrar en esa moneda.
 */
export function cotizacionEmpresa(moneda: MonedaPdv | null | undefined, empresa: MonedaPdv | null | undefined): number | null {
  if (moneda == null) return null;
  if (mismaMoneda(moneda, empresa)) return 1;
  return cotizacionEntreMonedas(moneda.cambio, empresa?.cambio);
}

/**
 * Valor de 1 unidad de `moneda` expresado en unidades de `base` (la moneda del PDV): lo que hay que multiplicar a
 * un monto de `moneda` para llevarlo a `base`. 1 si son la misma. null si falta alguna cotización.
 */
export function factorABase(
  moneda: MonedaPdv | null | undefined,
  base: MonedaPdv | null | undefined,
  empresa: MonedaPdv | null | undefined,
): number | null {
  if (moneda == null || base == null) return null;
  if (mismaMoneda(moneda, base)) return 1;
  const m = cotizacionEmpresa(moneda, empresa);
  const b = cotizacionEmpresa(base, empresa);
  if (m == null || b == null) return null;
  return m / b;
}

/** El monto en la moneda del PDV llevado a la moneda de la empresa: `round(montoBase × cotización, decimales de la empresa)`. */
export function equivalenteEmpresa(
  montoBase: number,
  cotizacionBase: number,
  decimalesEmpresa: number | null | undefined,
): number {
  return redondear(montoBase * cotizacionBase, decimalesEmpresa);
}

/**
 * ¿Está cerrado el saldo? Con decimales, cuando es menor que la mitad de la unidad más chica (el ruido del
 * flotante de `5,85 × 6100` y los centavos que no se pueden cobrar). Sin decimales solo se tolera el ruido del
 * flotante (1e-9), no media unidad: en una moneda entera el saldo cerraba únicamente con 0 y eso no cambia.
 */
export function saldoCerrado(saldo: number | null | undefined, decimales: number | null | undefined): boolean {
  if (saldo == null) return false;
  const d = decimales != null && isFinite(decimales) && decimales > 0 ? Math.floor(decimales) : 0;
  const tolerancia = d === 0 ? 1e-9 : 0.5 * Math.pow(10, -d);
  return Math.abs(Number(saldo)) < tolerancia;
}

/**
 * Múltiplos a los que se redondea un descuento. Sin decimales: 500 y 1000 (como siempre). Con decimales:
 * 0,05 / 0,10 / 1.
 */
export function multiplosRedondeo(decimales: number | null | undefined): number[] {
  const d = decimales != null && isFinite(decimales) && decimales > 0 ? Math.floor(decimales) : 0;
  return d === 0 ? [500, 1000] : [0.05, 0.1, 1];
}

/**
 * Descuento redondeado «hacia abajo» a un múltiplo del primer o segundo múltiplo (los de `multiplosRedondeo`),
 * sin pasarse nunca del descuento original. Con 0 decimales es, paso por paso, el cálculo que hacía el diálogo
 * del descuento (500 / 1000).
 */
export function redondearDescuento(descuento: number, decimales: number | null | undefined): number {
  const d = decimales != null && isFinite(decimales) && decimales > 0 ? Math.floor(decimales) : 0;
  const [m1, m2] = multiplosRedondeo(d);
  // Con decimales se trabaja en unidades mínimas enteras (centavos): el módulo de flotantes no es confiable.
  const escala = d === 0 ? 1 : Math.pow(10, d);
  const original = d === 0 ? descuento : Math.floor(Number((descuento * escala).toPrecision(12)));
  const u1 = d === 0 ? m1 : Math.round(m1 * escala);
  const u2 = d === 0 ? m2 : Math.round(m2 * escala);
  let discount = original;
  const resto1 = discount % u1;
  const resto2 = discount % u2;
  if (resto1 <= u1 / 2 && resto1 !== 0) {
    discount -= resto1;
  } else if (resto1 > u1 / 2) {
    if (discount + (u1 - resto1) <= original) {
      discount += u1 - resto1;
    } else {
      discount -= resto1;
    }
  } else if (resto2 !== 0) {
    if (discount + (u2 - resto2) <= original) {
      discount += u2 - resto2;
    }
  }
  return d === 0 ? discount : discount / escala;
}
