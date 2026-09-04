import { QrData } from '../../../../shared/qr-code/qr-code.component';
import { TipoEntidad } from '../../../../generics/tipo-entidad.enum';
import { VentaTarjeta } from '../venta-tarjeta.model';

/**
 * Arma el QrData que el celular escanea para completar una venta con tarjeta pendiente.
 *
 * El contrato con el mobile (venta-tarjeta-qr.service.ts, procesarQrVenta) es rígido y no
 * está expresado en ningún tipo compartido, así que vive acá y se testea:
 *
 *  - la cadena final tiene que empezar con "frc-" → se codifica con codificarQr(), NUNCA con
 *    JSON.stringify (esto rompía el flujo entero: el mobile rechazaba el QR con "QR no válido").
 *  - tipoEntidad tiene que ser VT.
 *  - componentToOpen tiene que ser exactamente 'RegistroVentaTarjetaComponent'.
 *  - data es posicional: cajaId|monto|ventaTarjetaId. El mobile hace split('|') y lee por índice.
 *  - idOrigen lleva el id de la VENTA (el mobile lo usa como ventaId), no el de la venta_tarjeta.
 *
 * Ningún campo puede contener "-": codificarQr une con guiones y descodificarQr hace split('-')
 * por posición. Por eso data usa "|" como separador interno.
 */
export function construirQrPayloadVentaTarjeta(item: VentaTarjeta): QrData {
  return {
    sucursalId: item.sucursalId,
    tipoEntidad: TipoEntidad.VENTA_TARJETA,
    idOrigen: item.venta?.id,
    idCentral: item.venta?.id,
    componentToOpen: 'RegistroVentaTarjetaComponent',
    data: (item.caja?.id ?? '') + '|' + item.monto + '|' + item.id,
    timestamp: Date.now()
  };
}
