/**
 * Nota de Crédito Electrónica (NCE, tipo 5 de SIFEN): acredita una factura electrónica aprobada.
 * En esta entrega solo NC total: los ítems y los totales los copia el central desde la factura.
 */

/** Espejo de MotivoEmisionNotaCredito del backend (catálogo TiMotEmi). */
export enum MotivoEmisionNotaCredito {
  DEVOLUCION_Y_AJUSTES_DE_PRECIOS = 'DEVOLUCION_Y_AJUSTES_DE_PRECIOS',
  DEVOLUCION = 'DEVOLUCION',
  DESCUENTO = 'DESCUENTO',
  BONIFICACION = 'BONIFICACION',
  CREDITO_INCOBRABLE = 'CREDITO_INCOBRABLE',
  RECUPERO_DE_COSTO = 'RECUPERO_DE_COSTO',
  RECUPERO_DE_GASTO = 'RECUPERO_DE_GASTO',
  AJUSTE_DE_PRECIO = 'AJUSTE_DE_PRECIO'
}

export const MOTIVOS_NOTA_CREDITO: { valor: MotivoEmisionNotaCredito; texto: string }[] = [
  { valor: MotivoEmisionNotaCredito.DEVOLUCION, texto: 'Devolución' },
  { valor: MotivoEmisionNotaCredito.DEVOLUCION_Y_AJUSTES_DE_PRECIOS, texto: 'Devolución y ajuste de precios' },
  { valor: MotivoEmisionNotaCredito.DESCUENTO, texto: 'Descuento' },
  { valor: MotivoEmisionNotaCredito.BONIFICACION, texto: 'Bonificación' },
  { valor: MotivoEmisionNotaCredito.CREDITO_INCOBRABLE, texto: 'Crédito incobrable' },
  { valor: MotivoEmisionNotaCredito.RECUPERO_DE_COSTO, texto: 'Recupero de costo' },
  { valor: MotivoEmisionNotaCredito.RECUPERO_DE_GASTO, texto: 'Recupero de gasto' },
  { valor: MotivoEmisionNotaCredito.AJUSTE_DE_PRECIO, texto: 'Ajuste de precio' }
];

export interface NotaCreditoItem {
  id?: number;
  sucursalId?: number;
  notaCreditoId?: number;
  facturaLegalItemId?: number;
  productoId?: number;
  presentacionId?: number;
  descripcion?: string;
  cantidad?: number;
  unidadMedida?: string;
  precioUnitario?: number;
  total?: number;
  iva?: number;
}

export interface NotaCredito {
  id?: number;
  sucursalId?: number;
  timbradoDetalleId?: number;
  numeroNotaCredito?: number;
  fecha?: string;
  facturaLegalId?: number;
  motivoEmision?: MotivoEmisionNotaCredito;
  descripcionMotivo?: string;
  clienteId?: number;
  nombre?: string;
  ruc?: string;
  direccion?: string;
  monedaExtranjera?: string;
  tipoCambio?: number;
  ivaParcial0?: number;
  ivaParcial5?: number;
  ivaParcial10?: number;
  totalParcial0?: number;
  totalParcial5?: number;
  totalParcial10?: number;
  descuento?: number;
  totalFinal?: number;
  activo?: boolean;
  usuarioId?: number;
  creadoEn?: string;
}
