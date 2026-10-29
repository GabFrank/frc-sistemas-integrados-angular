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
