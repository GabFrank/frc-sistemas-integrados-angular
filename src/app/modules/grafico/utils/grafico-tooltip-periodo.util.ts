import { formatoMonedaPy } from "../../../shared/utils/grafico-echarts.theme";
import {
  GraficoDesgloseAnho,
  GraficoDesglosePeriodo,
} from "./grafico-desglose-periodo.model";

export interface OpcionesTooltipGraficoPeriodo {
  titulo: string;
  total: number;
  desglosePeriodos?: GraficoDesglosePeriodo[];
  desgloseAnhos?: GraficoDesgloseAnho[];
  lineasExtra?: string[];
  formatearMonto?: (valor: number) => string;
  etiquetaTotalCombinado?: string;
}

function filtrarDesgloseAnhos(
  desgloseAnhos?: GraficoDesgloseAnho[]
): GraficoDesgloseAnho[] {
  return (desgloseAnhos ?? [])
    .filter((d) => d.total !== 0 || (d.cantidad ?? 0) > 0)
    .sort((a, b) => a.anio - b.anio);
}

function lineaCantidadAnho(cantidad?: number, sufijo = "ventas"): string {
  return cantidad != null
    ? ` · ${cantidad.toLocaleString("es-PY")} ${sufijo}`
    : "";
}

/** Tooltip con total agregado y desglose por período si hay más de uno. */
export function formatearTooltipGraficoPeriodo(
  opciones: OpcionesTooltipGraficoPeriodo
): string {
  const fmt = opciones.formatearMonto ?? formatoMonedaPy;
  const desglose = opciones.desglosePeriodos?.filter(
    (d) => d.total !== 0 || (d.cantidad ?? 0) > 0
  );
  const mostrarComparativa = (desglose?.length ?? 0) > 1;

  let html = `<strong>${opciones.titulo}</strong><br/>`;

  const totalesAnho = filtrarDesgloseAnhos(opciones.desgloseAnhos);
  const mostrarTotalesAnho = totalesAnho.length > 1;

  if (mostrarComparativa && desglose) {
    const etiquetaTotal =
      opciones.etiquetaTotalCombinado ?? "Total combinado";
    html += `<strong>${etiquetaTotal}:</strong> ${fmt(opciones.total)}<br/>`;
    if (mostrarTotalesAnho) {
      for (const anho of totalesAnho) {
        html += `<strong>Total ${anho.anio}:</strong> ${fmt(anho.total)}${lineaCantidadAnho(anho.cantidad)}<br/>`;
      }
    }
    html += `<hr style="border:0;border-top:1px solid #666;margin:5px 0"/>`;
    html += `<span style="font-size:0.9em;color:#bbb">Comparativa por período:</span><br/>`;
    for (const periodo of desglose) {
      const extraCantidad =
        periodo.cantidad != null
          ? ` · ${periodo.cantidad.toLocaleString("es-PY")} ventas`
          : "";
      html += `${periodo.etiqueta}: ${fmt(periodo.total)}${extraCantidad}<br/>`;
    }
  } else {
    html += `Total: ${fmt(opciones.total)}<br/>`;
  }

  for (const linea of opciones.lineasExtra ?? []) {
    html += `${linea}<br/>`;
  }

  return html;
}
