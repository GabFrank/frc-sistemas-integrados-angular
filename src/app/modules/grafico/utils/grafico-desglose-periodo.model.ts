/** Valor agregado de una entidad en un período (mes/año/rango). */
export interface GraficoDesglosePeriodo {
  etiqueta: string;
  total: number;
  cantidad?: number;
}

export interface ConDesglosePeriodoGrafico {
  desglosePeriodos?: GraficoDesglosePeriodo[];
}
