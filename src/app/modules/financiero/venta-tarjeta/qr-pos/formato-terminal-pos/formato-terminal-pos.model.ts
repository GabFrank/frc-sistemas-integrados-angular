import { MapeoQrPos } from '../formato-qr-pos.model';

/**
 * Formato del ticket de un MODELO DE APARATO.
 *
 * Reemplaza a `FormatoQrPos`, que resolvia el formato por proveedor y no distinguia una maquinita
 * Bancard de un portal web Bancard, ni dos firmwares de la misma marca. Aca un proveedor tiene
 * tantos formatos como modelos tenga, y cada terminal elige el suyo.
 *
 * Se administra SOLO en el central (`financiero.formato_terminal_pos`) y baja a cada filial por
 * replicacion MAIN_TO_ALL. El PDV lo lee del filial para poder trabajar sin internet.
 */
export interface FormatoTerminalPos {
  id?: number;
  nombre?: string;
  /**
   * En el filial viaja como id pelado; en el central, donde vive el ABM, como objeto para poder
   * mostrar el nombre. Se aceptan los dos.
   */
  proveedorServicioId?: number;
  proveedorServicio?: { id?: number; persona?: { nombre?: string } };
  /** MAQUINA | WEB | API. Ver {@link TipoFormatoTerminal}. */
  tipo?: string;
  /** Regex con grupos nombrados, anclado con ^ y $. Obligatorio salvo para API. */
  patron?: string;
  /** JSON serializado; ver {@link MapeoQrPos}. */
  mapeo?: string;
  ejemplo?: string;
  /**
   * Ojo con el significado: `false` es **"no elegible para asignar a terminales nuevas"**, no
   * "deja de funcionar". Las terminales que ya lo tienen siguen operando, y el backend rechaza
   * desactivar un formato que este en uso.
   */
  activo?: boolean;
  creadoEn?: Date;
}

/**
 * El tipo es el router del flujo: decide que camino se le ofrece al cajero y, sobre todo, cual se
 * le CIERRA. Una terminal WEB no ofrece la camara; una MAQUINA no ofrece el lector.
 *
 * Los valores estan cerrados en el backend con un CHECK (`V221.5`), asi que esta lista tiene que
 * coincidir exactamente.
 */
export const TIPO_MAQUINA = 'MAQUINA';
export const TIPO_WEB = 'WEB';
export const TIPO_API = 'API';

export interface TipoFormatoTerminal {
  valor: string;
  etiqueta: string;
  /** Que ve el usuario al elegirlo: por que camino se va a leer el cupon. */
  ayuda: string;
}

/**
 * API entra al modelo pero **el ABM todavia no lo ofrece**: no hay ninguna integracion asi, y
 * dejar elegir un tipo que ningun codigo sabe atender deja terminales en un estado muerto. Cuando
 * exista la primera integracion se agrega aca.
 */
export const TIPOS_FORMATO_TERMINAL: TipoFormatoTerminal[] = [
  {
    valor: TIPO_MAQUINA,
    etiqueta: 'Maquinita (ticket sin QR)',
    ayuda: 'El cupon se fotografia con el telefono y lo lee el OCR. No se ofrece el lector.',
  },
  {
    valor: TIPO_WEB,
    etiqueta: 'POS web (ticket con QR)',
    ayuda: 'El cupon trae un QR y lo lee el lector del PDV. No se ofrece la camara.',
  },
];

/** El mapeo tiene la misma forma que el de `formato_qr_pos`: es el mismo interprete. */
export type MapeoFormatoTerminal = MapeoQrPos;
