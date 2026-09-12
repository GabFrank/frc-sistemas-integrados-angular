/**
 * El mapa de un formato: qué caja del OCR es qué campo.
 *
 * Anclado a la **etiqueta impresa**, no a coordenadas absolutas. Un mapa por coordenadas se rompe
 * el día que el proveedor agrega una línea al ticket, y se rompen todos los mapas de ese modelo a
 * la vez. La geometría está igual, pero como **pista para acotar el reconocimiento** —reconocer 6
 * cajas en vez de 26 baja el OCR de 3.841 a ~900 ms— no como verdad para asignar.
 */

/** Una región ya guardada. */
export interface RegionFormato {
  id?: number;
  campo?: string;
  etiqueta?: string;
  /** DERECHA | ABAJO | DENTRO */
  posicion?: string;
  /** TEXTO | NUMERO | FECHA */
  tipo?: string;
  obligatorio?: boolean;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  /**
   * DERIVADA | MANUAL.
   *
   * No es decorativo: una región MANUAL **no la pisa una corrida de derivación**, ni siquiera con
   * la confirmación. Es una corrección que alguien hizo mirando un cupón.
   */
  origen?: string;
  orden?: number;
}

/** Una región propuesta por la derivación, o el motivo por el que ese campo no se pudo derivar. */
export interface RegionDerivada {
  campo?: string;
  etiqueta?: string;
  posicion?: string;
  /** Lo que se leyó en el cupón de muestra, para verificar de un vistazo. */
  valorLeido?: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  /**
   * `null` si se derivó bien; si no, por qué no se pudo.
   *
   * Un campo sin región **no es un fracaso**: se resuelve por patrón, sin restricción espacial. Un
   * mapa parcial es válido y es preferible a una región mal dibujada, que después acota el
   * reconocimiento y hace desaparecer un campo que hoy se lee bien.
   */
  sinRegion?: string;
}

export interface CapturaMuestraQr {
  token?: string;
  /** La ruta en central. El desktop la compone con el endpoint de central que ya usa. */
  ruta?: string;
  /** Absoluta, sólo si el servidor tiene configurada su dirección pública. */
  url?: string;
  expiraEn?: string;
}

export type EstadoMuestra = 'ESPERANDO' | 'LISTO' | 'ERROR' | 'VENCIDA';

export interface MuestraEstado {
  token?: string;
  estado?: EstadoMuestra;
  textoOcr?: string;
  error?: string;
  msOcr?: number;
}

/** Lo que devuelve guardar el mapa derivado. */
export interface ResultadoDerivacion {
  /** `false` = no se escribió nada todavía; falta confirmar. No es un error: es una pregunta. */
  aplicado?: boolean;
  creadas?: number;
  actualizadas?: number;
  /** Regiones derivadas que el patrón ya no produce: seguían acotando el OCR para nada. */
  eliminadas?: number;
  /** Campos cuya región MANUAL se dejó intacta. */
  conservadasManuales?: string[];
  /** El diff en frases: qué cambiaría por campo. Es lo que el operador tiene que leer. */
  cambios?: string[];
  mensaje?: string;
}
