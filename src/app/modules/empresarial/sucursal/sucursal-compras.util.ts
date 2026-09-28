/**
 * La sucursal COMPRAS no es un local: su stock solo lo ve quien tiene `VER_STOCK_COMPRAS` (o
 * ADMIN). Las pantallas que muestran stock por sucursal preguntan con esto antes de mostrarlo.
 *
 * Por nombre exacto, el mismo criterio que la lista de productos y el stock por lote. No por id:
 * el 999 es de bodega y no está garantizado en farmacia. Acepta cualquier cosa con `nombre`
 * porque hay diálogos que reciben solo el nombre de la sucursal, no el objeto.
 */
export function esSucursalCompras(sucursal: { nombre?: string }): boolean {
  return sucursal?.nombre === 'COMPRAS';
}
