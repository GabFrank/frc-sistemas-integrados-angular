/**
 * Texto del precio en una etiqueta (Fase 3 — precios en otra moneda).
 *
 * En la moneda de la empresa (`moneda` null) es EXACTAMENTE el de siempre: «Gs. 26.252», sin decimales.
 * En otra moneda lleva su símbolo y sus decimales: «US$ 4,39». Una etiqueta de otra moneda nunca se
 * imprime con el prefijo «Gs.».
 */
export function textoPrecioEtiqueta(
  precio: number,
  moneda: { simbolo?: string | null; decimales?: number | null } | null | undefined,
): string {
  if (moneda == null) {
    return `Gs. ${precio.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  const decimales = moneda.decimales != null && moneda.decimales > 0 ? moneda.decimales : 0;
  const monto = precio.toLocaleString('es-PY', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  return `${moneda.simbolo ? moneda.simbolo + ' ' : ''}${monto}`;
}

/**
 * Qué hacer con la moneda de una etiqueta según el mapa en caché de precios en otra moneda.
 *  - `empresa`: el mapa está vacío (bodega) o falló, o sigue cargando pasado el tope de espera: moneda de la empresa.
 *  - `consultar`: hay precios en otra moneda; hay que saber si el principal de este producto es uno de ellos.
 */
export function decisionMonedaEtiqueta(
  estadoMapa: 'sinCargar' | 'cargando' | 'ok' | 'error',
  tamanoMapa: number,
): 'empresa' | 'consultar' {
  return estadoMapa === 'ok' && tamanoMapa > 0 ? 'consultar' : 'empresa';
}

/**
 * Con precios en otra moneda en juego, una lectura del principal que no se pudo confirmar (`undefined`) NO cae a la
 * moneda de la empresa: un precio en dólares saldría como «Gs. 4». Bloquea la impresión hasta reintentar.
 */
export function lecturaDelPrincipalConfirmada(moneda: unknown | null | undefined): boolean {
  return moneda !== undefined;
}

/**
 * El precio llevado a la moneda de la empresa (para convertirlo luego a reales o dólares con sus cotizaciones,
 * que son «moneda de la empresa por unidad»). En la moneda de la empresa es el mismo número. En otra:
 * `precio * cambio` de esa moneda; null si no se conoce su cambio.
 */
export function precioEnMonedaEmpresa(
  precio: number,
  moneda: unknown | null | undefined,
  cambioMonedaPrecio: number | null | undefined,
): number | null {
  if (moneda == null) return precio;
  if (cambioMonedaPrecio == null || !(cambioMonedaPrecio > 0)) return null;
  return precio * cambioMonedaPrecio;
}
