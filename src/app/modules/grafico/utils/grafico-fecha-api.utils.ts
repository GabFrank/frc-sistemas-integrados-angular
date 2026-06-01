import { RangoFechaPeriodo } from "../../../commons/core/utils/dateUtils";

/** Formato que esperan algunos resolvers GraphQL de estadísticas (forma de pago, productos vendidos, etc.). */
const FORMATO_API = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

/**
 * Convierte fechas del filtro de gráficos (yyyy-MM-dd HH:mm) al formato del backend (yyyy-MM-dd HH:mm:ss).
 */
export function formatearFechaGraficoParaApi(
  fecha: string,
  esFin = false
): string {
  if (!fecha || /:\d{2}:\d{2}$/.test(fecha)) {
    return fecha;
  }
  if (!FORMATO_API.test(fecha)) {
    return fecha;
  }
  return esFin && fecha.endsWith(" 23:59") ? `${fecha}:59` : `${fecha}:00`;
}

export function formatearRangoFechaGraficoParaApi(
  rango: RangoFechaPeriodo
): RangoFechaPeriodo {
  return {
    inicio: formatearFechaGraficoParaApi(rango.inicio),
    fin: formatearFechaGraficoParaApi(rango.fin, true),
  };
}
