/**
 * Modelo del lector de códigos QR/barra de FRC.
 *
 * El formato canónico lo define `codificarQr` en shared/qr-code/qr-code.component.ts:
 *
 *   frc-{sucursalId}-{tipoEntidad}-{idOrigen}-{idCentral}-{componentToOpen}-{data}-{timestamp}
 *
 * Pero los emisores reales NO lo respetan de manera uniforme, y el parser tiene que convivir
 * con eso porque hay papeles impresos circulando. Lo verificado en el código de central:
 *
 *  - `sucursalId` viene hardcodeado en 0 en SOLPAG, TRF (ticket) y PEDIDO. No sirve para
 *    identificar la sucursal de origen.
 *  - `idOrigen` e `idCentral` llevan el mismo valor en todos los emisores.
 *  - El mismo tipo puede tener dos codificaciones: TRF impreso en ticket usa sucursalId=0,
 *    mientras que TRF en PDF (ImpresionService:880) sí lleva la sucursal real.
 *  - PRE_GASTO_RETIRO (PreGastoService:500) corre las posiciones: su 6º segmento es el
 *    qrToken, no el nombre de un componente.
 *
 * Por eso el parser devuelve los campos crudos por posición y deja que cada handler
 * interprete los suyos, en vez de asumir un significado fijo para todas las posiciones.
 */

/** Prefijo obligatorio de todo código emitido por el sistema. */
export const QR_PREFIJO = 'frc';

/** Cantidad de segmentos del formato canónico, contando el prefijo. */
const SEGMENTOS_MAX = 8;

/** Campos crudos de un código, por posición. Sin interpretar. */
export interface QrCrudo {
  /** El código tal como llegó del lector, ya normalizado (trim, sin CR/LF). */
  raw: string;
  /** Posición 1. Poco confiable: varios emisores mandan 0. */
  sucursalId: number | null;
  /** Posición 2. Discrimina el tipo de documento. Es el único campo confiable. */
  tipoEntidad: string;
  /** Posición 3. */
  idOrigen: number | null;
  /** Posición 4. En la práctica repite idOrigen. */
  idCentral: number | null;
  /** Posición 5. Nombre de componente en casi todos; qrToken en PRE_GASTO_RETIRO. */
  campo5: string | null;
  /** Posición 6. */
  campo6: string | null;
  /** Posición 7. */
  campo7: string | null;
}

export enum QrErrorTipo {
  VACIO = 'VACIO',
  PREFIJO_INVALIDO = 'PREFIJO_INVALIDO',
  INCOMPLETO = 'INCOMPLETO',
  TIPO_DESCONOCIDO = 'TIPO_DESCONOCIDO',
}

export interface QrError {
  tipo: QrErrorTipo;
  /** Mensaje listo para mostrarle al operador, en su idioma y sin jerga. */
  mensaje: string;
}

/**
 * Resultado del parseo. Campos opcionales en vez de unión discriminada a propósito: el
 * proyecto compila con `strict: false` y `strictNullChecks: false`, y sin eso TypeScript
 * no estrecha una unión por un literal booleano — `res.error` no compila aunque el `if`
 * lo garantice.
 */
export interface QrParseResultado {
  ok: boolean;
  /** Presente cuando ok es true. */
  qr?: QrCrudo;
  /** Presente cuando ok es false. */
  error?: QrError;
}

/** Tipos que el lector sabe rutear hoy. Agregar uno acá y su handler en el servicio. */
export enum QrTipoSoportado {
  SOLICITUD_PAGO = 'SOLPAG',
  RETIRO = 'RETIRO',
}

/**
 * Una fila del carrito de escaneo: un documento ya resuelto contra el backend.
 * `contraparteId` es lo que fija la regla de "todo del mismo proveedor" del backend
 * (PagoProveedorService.procesarEvento). Para RETIRO no aplica y va en null.
 */
export interface QrItemCarrito {
  tipo: QrTipoSoportado;
  /** Id con el que el destino identifica el documento. */
  id: number;
  /** Segunda mitad de la PK compuesta (Retiro). Null para los de PK simple. */
  sucursalId: number | null;
  /** Etiqueta corta para la fila: "Solicitud #412", "Retiro #1151". */
  etiqueta: string;
  /** Proveedor / sucursal de origen, según el tipo. */
  contraparte: string;
  /** Id de la contraparte, para validar que todo el carrito coincida. */
  contraparteId: number | null;
  monto: number;
  monedaSimbolo: string;
  /** Clave de deduplicación dentro del carrito. */
  clave: string;
  /**
   * El documento tal como lo devolvió el backend. Se guarda para que el destino no tenga
   * que volver a consultarlo: el carrito ya lo resolvió y ya validó su estado.
   */
  documento?: any;
}

/** Construye la clave de deduplicación de un item. */
export function claveItem(tipo: QrTipoSoportado, id: number, sucursalId: number | null): string {
  return `${tipo}:${id}:${sucursalId ?? 'x'}`;
}
