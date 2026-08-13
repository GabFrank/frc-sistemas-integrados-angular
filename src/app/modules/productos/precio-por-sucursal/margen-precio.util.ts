/**
 * Margen mínimo (markup sobre el costo) que se espera de un precio de venta.
 * Un precio con margen menor a este porcentaje dispara un aviso al usuario,
 * que puede continuar igual o cancelar.
 */
export const MARGEN_MINIMO_PORCENTAJE = 30;

export class EvaluacionMargen {
  /** Costo de una unidad de la presentación, en guaraníes. */
  costoPresentacion: number;
  /** Margen del precio sobre el costo de la presentación, en porcentaje. */
  margenPorcentaje: number;
  /** Precio que alcanzaría exactamente el margen mínimo. */
  precioMinimoSugerido: number;
  /** True si el margen quedó por debajo del mínimo y hay que avisar. */
  debeAvisar: boolean;
}

/**
 * Evalúa el margen de un precio de venta contra el costo del producto.
 *
 * `costoMedio` es el precio de compra promedio ponderado del producto, en guaraníes y por
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
