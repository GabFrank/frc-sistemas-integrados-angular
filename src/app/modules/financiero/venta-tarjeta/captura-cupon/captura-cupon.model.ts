/**
 * Captura de la foto del cupón: el camino para los POS que no imprimen QR.
 *
 * El desktop pide una captura al filial, muestra la URL que vuelve dentro de un QR, y el cajero
 * la escanea con cualquier teléfono. La página que se abre la sirve el mismo filial por HTTP en
 * la LAN, así que no hace falta app instalada, ni login, ni certificado.
 */

/** Lo que el filial devuelve al abrir una captura. La URL ya viene armada por él. */
export interface CapturaCuponQr {
  token: string;
  url: string;
  /** ISO local. Pasado eso el QR no sirve y hay que pedir otro. */
  expiraEn: string;
}

export type EstadoCaptura = 'ESPERANDO' | 'PROCESANDO' | 'LISTO' | 'ERROR';

export interface CapturaCupon {
  id?: number;
  token?: string;
  cajaId?: number;
  estado?: EstadoCaptura;
  /** Texto crudo del OCR, una línea por caja detectada. */
  textoOcr?: string;
  error?: string;
  msOcr?: number;
  intentos?: number;
  expiraEn?: string;
  usadoEn?: string;
}
