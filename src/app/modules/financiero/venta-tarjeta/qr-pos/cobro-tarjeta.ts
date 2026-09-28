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

/**
 * Las líneas de tarjeta que se van a registrar y todavía no tienen terminal.
 *
 * Con la perilla `terminalObligatoria` prendida, `pago-touch.onFinalizar` no cierra la venta mientras
 * esta lista no esté vacía. Existe porque el lector escribía en el cobro de atrás y su Enter
 * finalizaba la venta sin terminal: en farmacia filial 1, 116 de 631 del 25 al 28/09/2026.
 *
 * `requiereRegistroTarjeta` por lo mismo que en `onFinalizar`: las líneas ya cobradas de un delivery
 * que se reabre no se registran de nuevo, así que tampoco se les exige terminal acá.
 */
export function lineasTarjetaSinTerminal(lineas: CobroDetalle[]): CobroDetalle[] {
  return (lineas || []).filter(cd =>
    esCobroTarjetaRegistrable(cd) && cd.requiereRegistroTarjeta && !cd.terminalPos?.id);
}
