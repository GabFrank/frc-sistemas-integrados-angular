import { ProductoCostoPorPeriodo } from './producto-costo-periodo.model';

export interface EvolucionCostoResumen {
  costoInicial: number;
  costoFinal: number;
  variacionPorcentual: number;
  costoPromedioPonderado: number;
  periodoConMayorCosto: string;
  totalCompras: number;
  hayDatos: boolean;
}

export interface EvolucionCostoResponse {
  periodos: ProductoCostoPorPeriodo[];
  resumen: EvolucionCostoResumen;
}
