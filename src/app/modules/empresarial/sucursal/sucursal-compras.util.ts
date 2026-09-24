import { Sucursal } from './sucursal.model';

/**
 * La sucursal COMPRAS no es un local: su stock solo lo ve quien tiene `VER_STOCK_COMPRAS` (o
 * ADMIN). Las pantallas que muestran stock por sucursal preguntan con esto antes de mostrarlo.
 *
 * Por nombre exacto, el mismo criterio que la lista de productos y el stock por lote. No por id:
 * el 999 es de bodega y no está garantizado en farmacia.
 */
export function esSucursalCompras(sucursal: Sucursal): boolean {
  return sucursal?.nombre === 'COMPRAS';
}
