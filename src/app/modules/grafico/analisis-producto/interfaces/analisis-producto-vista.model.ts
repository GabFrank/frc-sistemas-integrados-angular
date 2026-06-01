import { EChartsOption } from "echarts";
import { AnalisisProductoProductoDetalle } from "./analisis-producto-producto-detalle.model";

export interface AnalisisProductoVista {
  rankingOptions: EChartsOption;
  temporalOptions: EChartsOption;
  productos: AnalisisProductoProductoDetalle[];
  productoSeleccionado: AnalisisProductoProductoDetalle | null;
  promedioPeriodo: string;
  periodoPico: string;
  labelPeriodoPico: string;
  hayDatos: boolean;
  tituloRanking: string;
}
