import { SolicitudGastoData } from '../models/solicitud-gasto-data.model';

export interface EnteFinancialSummaryResponse {
  enteId?: number;
  descripcion?: string;
  montoTotal?: number;
  montoYaPagado?: number;
  montoPendiente?: number;
  cuotasTotales?: number;
  cuotasPagadas?: number;
  cuotasFaltantes?: number;
  diaVencimiento?: number;
  diasParaVencer?: number;
  estadoCuota?: string;
  monedaSimbolo?: string;
  monedaId?: number;
  proveedorNombre?: string;
  proveedorId?: number;
  tipoGastoSugeridoId?: string;
  situacionPago?: string;
  porcentajePagado?: number;
  montoSugerido?: number;
  descripcionSugerida?: string;
  autocompletarMonto?: boolean;
  numeroCuotaActual?: number;
  fechaVencimientoSugerida?: string;
}

export function mapearSummaryASolicitudGastoData(
  summary: EnteFinancialSummaryResponse,
  tipoBien?: string | null
): SolicitudGastoData {
  return {
    enteId: summary.enteId,
    bienDescripcion: summary.descripcion,
    descripcion: summary.descripcionSugerida,
    monto: summary.montoSugerido,
    montoTotal: summary.montoTotal,
    montoYaPagado: summary.montoYaPagado,
    montoPendiente: summary.montoPendiente,
    cuotasTotales: summary.cuotasTotales,
    cuotasPagadas: summary.cuotasPagadas,
    cuotasFaltantes: summary.cuotasFaltantes,
    diaVencimiento: summary.diaVencimiento,
    diasParaVencer: summary.diasParaVencer,
    estadoCuota: summary.estadoCuota,
    moneda: summary.monedaSimbolo,
    monedaId: summary.monedaId,
    proveedor: summary.proveedorNombre,
    proveedorNombre: summary.proveedorNombre,
    proveedorId: summary.proveedorId,
    situacionPago: summary.situacionPago,
    porcentajePagado: summary.porcentajePagado,
    montoSugerido: summary.montoSugerido,
    tipoGastoSugeridoId: summary.tipoGastoSugeridoId,
    tipoBien: tipoBien ?? undefined,
  };
}

export function parsearFechaVencimientoSugerida(
  fecha: string | Date | null | undefined
): Date | null {
  if (!fecha) {
    return null;
  }
  if (fecha instanceof Date) {
    return fecha;
  }
  const parsed = new Date(fecha);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function construirNotificacionVencimiento(diasParaVencer?: number | null): string | null {
  if (diasParaVencer == null) {
    return null;
  }
  if (diasParaVencer < 0) {
    return `ATENCIÓN: La cuota está vencida hace ${Math.abs(diasParaVencer)} días.`;
  }
  if (diasParaVencer <= 10) {
    return `AVISO: El vencimiento es en ${diasParaVencer} días.`;
  }
  return `INFO: Faltan ${diasParaVencer} días para el vencimiento.`;
}
