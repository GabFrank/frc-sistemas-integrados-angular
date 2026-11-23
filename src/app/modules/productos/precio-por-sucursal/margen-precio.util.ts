/**
 * Margen mínimo (markup sobre el costo) que se espera de un precio de venta.
 * Un precio con margen menor a este porcentaje dispara un aviso al usuario,
 * que puede continuar igual o cancelar.
 */
export const MARGEN_MINIMO_PORCENTAJE = 30;

export class EvaluacionMargen {
  /** Costo de una unidad de la presentación, en la moneda del precio. */
  costoPresentacion: number;
  /** Margen del precio sobre el costo de la presentación, en porcentaje. */
  margenPorcentaje: number;
  /** Precio que alcanzaría exactamente el margen mínimo. */
  precioMinimoSugerido: number;
  /** True si el margen quedó por debajo del mínimo y hay que avisar. */
  debeAvisar: boolean;
}

/** Lo mínimo que hace falta saber de una moneda para llevar un costo a la del precio. */
export interface MonedaDeCosto {
  id?: number | string | null;
  /** Guaraníes por unidad (el cambio del comercio); la principal lleva 1. */
  cambio?: number | null;
}

/** El costo del producto en su moneda de costeo (módulo COSTOS), si se pudo leer. */
export interface CostoDeCosteo {
  moneda: MonedaDeCosto;
  costoMedio: number | null;
}

/**
 * El costo medio llevado a la moneda del precio, para comparar peras con peras.
 *
 * - Precio en la moneda de la empresa (`monedaPrecio` null o igual a la empresa): el costo de la
 *   empresa, tal cual (lo de siempre).
 * - Si la moneda de costeo es la del precio y trae costo: ese costo, sin convertir.
 * - Si no: el costo de la empresa convertido con los cambios del comercio
 *   (`costoEmpresa * cambioEmpresa / cambioPrecio`; el cambio de la empresa ausente cuenta como 1).
 *
 * Devuelve null cuando no se puede (sin costo, o sin cambio de la moneda del precio): sin costo no
 * hay margen y no se avisa nada. No redondea: el redondeo va al mostrar.
 */
export function costoEnMonedaDelPrecio(
  costoMedioEmpresa: number | null | undefined,
  monedaPrecio: MonedaDeCosto | null | undefined,
  monedaEmpresa: MonedaDeCosto | null | undefined,
  costeo?: CostoDeCosteo | null,
): number | null {
  const esEmpresa = monedaPrecio == null
    || (monedaEmpresa?.id != null && monedaPrecio.id != null && String(monedaEmpresa.id) === String(monedaPrecio.id));
  if (esEmpresa) return costoMedioEmpresa ?? null;

  if (costeo?.costoMedio != null && costeo.costoMedio > 0 && costeo.moneda?.id != null && monedaPrecio.id != null
      && String(costeo.moneda.id) === String(monedaPrecio.id)) {
    return costeo.costoMedio;
  }

  if (costoMedioEmpresa == null || !(costoMedioEmpresa > 0)) return null;
  const cambioPrecio = monedaPrecio.cambio;
  if (cambioPrecio == null || !(cambioPrecio > 0)) return null;
  const cambioEmpresa = monedaEmpresa?.cambio != null && monedaEmpresa.cambio > 0 ? monedaEmpresa.cambio : 1;
  return (costoMedioEmpresa * cambioEmpresa) / cambioPrecio;
}

/**
 * Evalúa el margen de un precio de venta contra el costo del producto.
 *
 * `costoMedio` es el precio de compra promedio ponderado del producto, en la moneda del precio
 * (la de la empresa salvo que el precio esté en otra; ver {@link costoEnMonedaDelPrecio}) y por
 * unidad base de stock (lo calcula el central en CostosPorProductoService). Una presentación
 * consume `cantidadPorPresentacion` unidades de stock por cada venta, así que el costo contra
 * el que se compara el precio es el costo medio multiplicado por esa cantidad.
 *
 * Devuelve null cuando no hay costo cargado (producto sin compras registradas): sin precio de
 * compra no hay margen que calcular y no corresponde avisar nada.
 */
export function evaluarMargenPrecio(
  precio: number,
  costoMedio: number,
  cantidadPorPresentacion: number
): EvaluacionMargen {
  if (costoMedio == null || costoMedio <= 0) return null;
  if (precio == null || isNaN(precio)) return null;

  const cantidad =
    cantidadPorPresentacion != null && cantidadPorPresentacion > 0
      ? cantidadPorPresentacion
      : 1;

  const costoPresentacion = costoMedio * cantidad;
  const margenPorcentaje =
    ((precio - costoPresentacion) / costoPresentacion) * 100;

  return {
    costoPresentacion,
    margenPorcentaje,
    precioMinimoSugerido:
      costoPresentacion * (1 + MARGEN_MINIMO_PORCENTAJE / 100),
    debeAvisar: margenPorcentaje < MARGEN_MINIMO_PORCENTAJE,
  };
}
