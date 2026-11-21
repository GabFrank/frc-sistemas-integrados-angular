import { CobroDetalle } from '../../../operaciones/venta/cobro/cobro-detalle.model';
import { DatosCupon } from './formato-qr-pos.model';

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

/**
 * Otra línea del mismo cobro que ya tiene este cupón, o null (#625).
 *
 * El backend solo ve cupones ya guardados, así que el mismo QR escaneado en dos líneas antes de
 * finalizar pasaba las dos veces: venta 81509 de Itaipú, cobros 1670 y 1672. Desde #278 el filial
 * rechaza el segundo al completar, pero recién después de guardar la venta.
 *
 * La regla es la de `motivoCuponNoUsable` del filial: mismo QR, misma referencia, o mismo código de
 * autorización en la misma terminal con el mismo monto del cupón (si falta un monto no descarta).
 * Sin terminal en cualquiera de los dos lados cuenta como la misma: allá solo si falta en la
 * consulta, así que esto es un poco más estricto, del lado de avisar de más; en el cobro no pasa,
 * porque escanearTarjeta pone la terminal antes de leer el cupón. Los ids se comparan con
 * Number(): GraphQL `ID` llega como string.
 *
 * No filtra por `esCobroTarjetaRegistrable`: solo una línea con cupón aplicado tiene `datosCupon`.
 */
export function lineaConMismoCupon(
  lineas: CobroDetalle[],
  item: CobroDetalle,
  cupon: DatosCupon
): CobroDetalle | null {
  if (!cupon) return null;
  const texto = (v?: string) => (v || '').trim();
  const qr = texto(cupon.qrCrudo);
  const ref = texto(cupon.identificadorTransaccion);
  const codigo = texto(cupon.codigoAutorizacion).toUpperCase();
  return (lineas || []).find(otra => {
    const suyo = otra?.datosCupon;
    if (!suyo || otra === item) return false;
    if (qr && texto(suyo.qrCrudo) === qr) return true;
    if (ref && texto(suyo.identificadorTransaccion) === ref) return true;
    if (!codigo || texto(suyo.codigoAutorizacion).toUpperCase() !== codigo) return false;
    const a = otra.terminalPos?.id;
    const b = item?.terminalPos?.id;
    const mismaTerminal = a == null || b == null || Number(a) === Number(b);
    const montosDistintos = suyo.monto != null && cupon.monto != null && Number(suyo.monto) !== Number(cupon.monto);
    return mismaTerminal && !montosDistintos;
  }) ?? null;
}
