import { CostoPorProducto } from './costo-por-producto.model';

/**
 * ultimoPrecioCompra ya se persiste en Gs desde el backend (igual que costoMedio); moneda/cotizacion
 * quedan solo como referencia de la moneda original de la compra. Esta función es un passthrough que se
 * conserva para no cambiar los call-sites y como punto único si la semántica volviera a cambiar.
 */
export function ultimoPrecioCompraEnGs(costo: CostoPorProducto | null | undefined): number | null {
  return costo?.ultimoPrecioCompra ?? null;
}
