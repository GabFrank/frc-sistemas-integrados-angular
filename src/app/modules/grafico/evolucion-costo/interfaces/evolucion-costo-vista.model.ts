import { EChartsOption } from 'echarts';

export interface EvolucionCostoVista {
  chartOptions: EChartsOption;
  hayDatos: boolean;
  productoNombre: string | null;
  costoInicial: string;
  costoFinal: string;
  variacion: string;
  /** true = el costo subió en el período (desfavorable). */
  variacionPositiva: boolean;
  costoPromedio: string;
  periodoPico: string;
  totalCompras: number;
}
