import { NotaRecepcionItem } from '../nota-recepcion-item.model';

/** A qué nota va el ítem rechazado (`DestinoRechazoNotaRecepcion` del central). */
export enum DestinoRechazoNotaRecepcion {
  NOTA_EXISTENTE = 'NOTA_EXISTENTE',
  NOTA_NUEVA = 'NOTA_NUEVA',
  NOTA_RECHAZO = 'NOTA_RECHAZO',
}

/**
 * Rechazo desde la recepción documental: el central hace todos los pasos en una transacción.
 * Con `notaRecepcionItemId` rechaza un ítem que ya está en una nota; sin él, crea uno para `pedidoItemId`.
 */
export interface RechazarNotaRecepcionItemInput {
  pedidoItemId?: number;
  notaRecepcionItemId?: number;
  destino: DestinoRechazoNotaRecepcion;
  notaRecepcionId?: number;
  presentacionId?: number;
  /** En unidades de la presentación elegida. */
  cantidad: number;
  motivoRechazo: string;
  observacion?: string;
}

export interface RechazoNotaRecepcionItemResultado {
  notaRecepcionItem: NotaRecepcionItem | null;
  /** Cantidad rechazada en unidades base. */
  cantidadEnUnidadesBase: number;
}
