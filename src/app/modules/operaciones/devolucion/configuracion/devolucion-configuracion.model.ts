// Configuración del módulo de devoluciones. Campos = contrato GraphQL del backend.

export interface DevolucionConfiguracion {
  id?: string;
  // Dashboard / umbrales
  diasEstancada?: number;
  diasEstancadaUrgente?: number;
  rankingTopN?: number;
  dashboardRangoDefault?: string; // MES_ACTUAL | ULTIMOS_30 | MES_ANTERIOR
  // Impresión
  ticketAnchoMm?: number;
  impresoraTicket?: string;
  comprobanteTitulo?: string;
  comprobanteTextoFirma?: string;
  // Merma / gasto
  mermaRespetaMotivo?: boolean;
  tipoGastoMerma?: string;
  // Alerta de compras
  alertaIncluyeRetirado?: boolean;
  alertaBloqueante?: boolean;
  // Stock
  permitirStockNegativo?: boolean;
}
