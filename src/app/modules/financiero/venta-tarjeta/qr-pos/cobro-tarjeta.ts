import { CobroDetalle } from '../../../operaciones/venta/cobro/cobro-detalle.model';

/**
 * Una línea de cobro que corresponde a un pago con tarjeta que hay que registrar en venta_tarjeta.
 *
 * Las tres exclusiones no son cosméticas:
 *  - !pago  → la línea es un cobro entrante, no un pago hacia afuera.
 *  - !vuelto → el vuelto en tarjeta no pasa por el POS, no hay cupón que escanear.
 *  - !descuento → un descuento no mueve plata por la terminal.
 *
 * Si esto se relaja, se generan venta_tarjeta PENDIENTE que nunca se van a poder completar y que
 * después bloquean el cierre de caja del cajero.
 *
 * OJO: el mismo predicado está escrito inline en pago-touch.component.html (ícono de estado y
 * ícono de QR). No se puede llamar esta función desde el template — la regla del repo prohíbe
 * funciones en bindings — así que si cambia acá, hay que cambiarlo también allá.
 */
export function esCobroTarjetaRegistrable(cd: CobroDetalle): boolean {
  return cd?.formaPago?.descripcion === 'TARJETA'
    && !!cd.pago
    && !cd.vuelto
    && !cd.descuento;
}
