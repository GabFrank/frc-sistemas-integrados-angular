/**
 * Formato del QR que imprime la maquinita de un proveedor.
 *
 * La fila se administra en el central (tabla `financiero.formato_qr_pos`) y baja a cada filial
 * por replicacion MAIN_TO_ALL. El PDV la lee del filial para poder escanear sin internet.
 */
export interface FormatoQrPos {
  id?: number;
  nombre?: string;
  /**
   * En el filial (que es de donde lo lee el PDV) viaja como id pelado; en el central, donde vive
   * el ABM, como objeto para poder mostrar el nombre. Se aceptan los dos.
   */
  proveedorServicioId?: number;
  proveedorServicio?: { id?: number; persona?: { nombre?: string } };
  /** Regex con grupos nombrados, anclado con ^ y $. */
  patron?: string;
  /** JSON serializado; ver {@link MapeoQrPos}. */
  mapeo?: string;
  ejemplo?: string;
  activo?: boolean;
}

/**
 * Como se transforma un grupo capturado en un campo nuestro.
 *
 * El vocabulario es cerrado a proposito. En cuanto se admiten expresiones, el ABM se convierte
 * en un lenguaje de programacion dentro de un formulario y cualquiera puede colgar una caja.
 */
export interface ReglaCampo {
  /** Nombre del grupo del patron: `(?<auth>...)` -> `"auth"`. */
  de: string;
  /** Valor literal -> id nuestro. Se usa para la moneda. */
  mapa?: { [valor: string]: number };
  /** Divisor fijo. */
  escala?: number;
  /** Divide por 10^decimales de la moneda resuelta. Para importes en la menor unidad. */
  escalaSegunMoneda?: boolean;
  /** Formato de fecha, hoy solo `yyyyMMddHHmm`. */
  formato?: string;
  /** Zona horaria en que esta expresada la fecha del cupon. */
  zona?: string;
  mayusculas?: boolean;
}

export interface MapeoQrPos {
  codigoAutorizacion?: ReglaCampo;
  numeroBoleta?: ReglaCampo;
  moneda?: ReglaCampo;
  monto?: ReglaCampo;
  identificadorTransaccion?: ReglaCampo;
  fecha?: ReglaCampo;
}

/** Resultado de leer un cupon. */
export interface DatosCupon {
  codigoAutorizacion?: string;
  numeroBoleta?: string;
  monedaId?: number;
  monto?: number;
  identificadorTransaccion?: string;
  fecha?: Date;
  /** La cadena tal cual entro por el lector, sin normalizar. */
  qrCrudo: string;
  /** Formato que la reconocio. */
  formato: FormatoQrPos;
}

export interface ResultadoParseo {
  ok: boolean;
  datos?: DatosCupon;
  /** Mensaje para mostrarle al cajero cuando `ok` es false. */
  error?: string;
}
