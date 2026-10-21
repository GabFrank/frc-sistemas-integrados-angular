/** Una parte de la división: cuánto (en la presentación elegida) va a qué nota. */
export interface ParteDivisionPedidoItemInput {
  notaRecepcionId: number | null;
  cantidad: number;
}

/** División de un ítem del pedido en varias notas: el central guarda todas las partes en una transacción. */
export interface DividirPedidoItemInput {
  pedidoItemId: number;
  presentacionId?: number;
  partes: ParteDivisionPedidoItemInput[];
}
