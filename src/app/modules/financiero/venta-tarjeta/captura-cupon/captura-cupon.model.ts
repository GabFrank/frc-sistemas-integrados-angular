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
  /**
   * Los campos ya separados, como JSON. Llega vacío cuando la terminal no tiene formato o el
   * patrón no reconoció el cupón: ahí el cajero se queda con `textoOcr` y carga a mano, que es
   * exactamente lo que el módulo hacía antes de esta etapa. Ver {@link parsearCampos}.
   */
  campos?: string;
  error?: string;
  msOcr?: number;
  intentos?: number;
  expiraEn?: string;
  usadoEn?: string;
}

/**
 * Lo que el filial extrajo del cupón, ya parseado.
 *
 * Las claves canónicas son las mismas que usa `venta_tarjeta`. `datosExtra` guarda lo que el
 * patrón capturó y no tiene columna propia; no se muestra en el formulario.
 */
export interface CamposCupon {
  codigoAutorizacion?: string;
  numeroBoleta?: string;
  monto?: number | string;
  terminal?: string;
  identificadorTransaccion?: string;
  moneda?: string;
  datosExtra?: { [clave: string]: any };
  /**
   * Confianza 0..1 por campo canónico. **Un campo que no aparece acá es un campo del que no se
   * sabe**, y se trata igual que uno de confianza baja: hay que preguntarlo.
   *
   * No es la confianza de la foto. El promedio por foto está medido y no distingue una línea
   * buena de una mala: un cupón con el monto ilegible y el resto perfecto promedia alto.
   */
  confianzas?: { [campo: string]: number };
}

/**
 * Parsea `campos` sin romperse.
 *
 * Devuelve `null` cuando no hay nada o el JSON no se puede leer — y ese caso **no es un error**:
 * significa que esta captura se queda en el camino viejo, texto crudo y carga a mano. El OCR ya
 * hizo su trabajo; que el patrón no matchee es una condición normal de operación.
 */
export function parsearCampos(campos: string): CamposCupon | null {
  if (!campos) return null;
  try {
    const o = JSON.parse(campos);
    return o && typeof o === 'object' ? (o as CamposCupon) : null;
  } catch {
    return null;
  }
}
