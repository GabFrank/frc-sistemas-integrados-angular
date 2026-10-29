/**
 * Conversión del precio de lista a la moneda de cobro (Fase 3 — precios en otra moneda).
 *
 * UNA sola función de conversión para todo el escritorio. Tiene que dar lo mismo que `RastroPrecio`
 * de la filial (que recalcula con el rastro y loguea si no coincide):
 *
 *   precio = round_HALF_UP(precioLista * precioCotizacion, decimales de la moneda de cobro)
 *
 * `precioCotizacion` = unidades de la moneda de cobro por unidad de la moneda del precio
 * = cambio(monedaPrecio) / cambio(monedaCobro), con `Moneda.cambio` en guaraníes por unidad
 * (la principal lleva 1).
 *
 * La multiplicación es decimal exacta (como `BigDecimal.valueOf(a).multiply(BigDecimal.valueOf(b))`):
 * cada double entra por su representación decimal más corta, no por su valor binario, y se redondea
 * una sola vez. Sin acumular flotantes.
 */

/** Un decimal exacto: `entero * 10^-escala`. */
interface Decimal {
  entero: bigint;
  escala: number;
}

/** El double como lo ve `BigDecimal.valueOf` (su representación decimal más corta). null si no es finito. */
function aDecimal(valor: number): Decimal | null {
  if (typeof valor !== 'number' || !isFinite(valor)) return null;
  const texto = String(Math.abs(valor)).toLowerCase();
  const [mantisa, exponente] = texto.split('e');
  const [parteEntera, parteDecimal = ''] = mantisa.split('.');
  let entero = BigInt(parteEntera + parteDecimal);
  let escala = parteDecimal.length - (exponente ? parseInt(exponente, 10) : 0);
  if (escala < 0) {
    entero = entero * 10n ** BigInt(-escala);
    escala = 0;
  }
  return { entero: valor < 0 ? -entero : entero, escala };
}

/** Pasa `entero * 10^-escala` a `decimales` decimales, HALF_UP (el medio se aleja del cero), y lo devuelve como number. */
function redondear(entero: bigint, escala: number, decimales: number): number {
  const negativo = entero < 0n;
  let abs = negativo ? -entero : entero;
  if (escala > decimales) {
    const divisor = 10n ** BigInt(escala - decimales);
    const resto = abs % divisor;
    abs = abs / divisor;
    if (resto * 2n >= divisor) abs += 1n;
  } else if (escala < decimales) {
    abs = abs * 10n ** BigInt(decimales - escala);
  }
  const texto = abs.toString().padStart(decimales + 1, '0');
  const corte = texto.length - decimales;
  const resultado = Number(decimales > 0 ? `${texto.slice(0, corte)}.${texto.slice(corte)}` : texto);
  return negativo ? -resultado : resultado;
}

/** Decimales válidos de una moneda: entero >= 0; sin dato, 0. */
function decimalesValidos(decimales: number | null | undefined): number {
  return decimales != null && isFinite(decimales) && decimales > 0 ? Math.floor(decimales) : 0;
}

/**
 * `precioLista * cotizacion` redondeado HALF_UP a `decimales`. null si falta algo o la cotización no es > 0.
 */
export function convertirPrecioLista(
  precioLista: number | null | undefined,
  cotizacion: number | null | undefined,
  decimales: number | null | undefined,
): number | null {
  if (precioLista == null || cotizacion == null || !(cotizacion > 0)) return null;
  const a = aDecimal(precioLista);
  const b = aDecimal(cotizacion);
  if (a == null || b == null) return null;
  return redondear(a.entero * b.entero, a.escala + b.escala, decimalesValidos(decimales));
}

/** Redondea un monto a `decimales`, HALF_UP. */
export function redondearMonto(valor: number | null | undefined, decimales: number | null | undefined): number | null {
  const d = valor == null ? null : aDecimal(valor);
  return d == null ? null : redondear(d.entero, d.escala, decimalesValidos(decimales));
}

/**
 * Unidades de la moneda de cobro por unidad de la moneda del precio, con los cambios del comercio
 * (guaraníes por unidad). El cambio de la moneda de cobro ausente cuenta como 1 (la principal);
 * el de la moneda del precio ausente o <= 0 no se puede convertir: null.
 */
export function cotizacionEntreMonedas(
  cambioMonedaPrecio: number | null | undefined,
  cambioMonedaCobro: number | null | undefined,
): number | null {
  if (cambioMonedaPrecio == null || !(cambioMonedaPrecio > 0)) return null;
  const cobro = cambioMonedaCobro == null ? 1 : cambioMonedaCobro;
  if (!(cobro > 0)) return null;
  return cambioMonedaPrecio / cobro;
}

/** El rastro que viaja con el ítem convertido (se omite entero cuando no hubo conversión). */
export interface RastroPrecio {
  precio: number;
  precioMonedaId: number;
  precioLista: number;
  precioCotizacion: number;
}

/**
 * Convierte un precio de lista y arma el rastro, o null si no se puede (sin cotización).
 * `monedaPrecioId` se manda como número: GraphQL lo devuelve como string pero el input es Int.
 */
export function convertirConRastro(
  precioLista: number,
  monedaPrecioId: number | string,
  cambioMonedaPrecio: number | null | undefined,
  cambioMonedaCobro: number | null | undefined,
  decimalesCobro: number | null | undefined,
): RastroPrecio | null {
  const cotizacion = cotizacionEntreMonedas(cambioMonedaPrecio, cambioMonedaCobro);
  const precio = convertirPrecioLista(precioLista, cotizacion, decimalesCobro);
  if (cotizacion == null || precio == null) return null;
  return { precio, precioMonedaId: Number(monedaPrecioId), precioLista, precioCotizacion: cotizacion };
}
