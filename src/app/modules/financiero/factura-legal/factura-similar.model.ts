/**
 * Factura ya emitida en el turno de caja que se parece a la que se está por generar.
 * Solo se usa para mostrar el aviso de posible duplicado antes de emitirla.
 */
export class FacturaSimilar {
  facturaLegalId: number;
  /** Formato EEE-PPP-NNNNNNN */
  numeroFactura: string;
  fecha: Date;
  totalFinal: number;
  clienteNombre: string;
}
