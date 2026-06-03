import { GraficoFiltrosPeriodo } from "./grafico-filtro-rango-fechas.helper";
import { PeriodoGraficoInput } from "./grafico-periodo.model";

export function periodosDesdeFiltro(
  filtro: GraficoFiltrosPeriodo
): PeriodoGraficoInput[] {
  return filtro.resolverRangosConsultaEtiquetados().map((rango) => ({
    etiqueta: rango.etiqueta,
    inicio: rango.inicio,
    fin: rango.fin,
  }));
}

export function idsGraficoComoString(ids?: number[] | null): string[] | null {
  if (!ids?.length) {
    return null;
  }
  return ids.map((id) => String(id));
}
