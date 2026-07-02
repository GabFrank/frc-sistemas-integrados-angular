import { CostoPorProducto } from './costo-por-producto.model';

/**
 * Convierte ultimoPrecioCompra a guaraníes usando la cotización guardada en el registro de costo.
 * costoMedio siempre está en Gs; ultimoPrecioCompra se guarda en la moneda de la última compra.
 */
export function ultimoPrecioCompraEnGs(costo: CostoPorProducto | null | undefined): number | null {
  if (costo?.ultimoPrecioCompra == null) {
    return null;
  }
  const cotizacion = costo.cotizacion ?? costo.moneda?.cambio ?? 1;
  return costo.ultimoPrecioCompra * cotizacion;
}
