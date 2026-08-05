import { EChartsOption } from 'echarts';

export interface RankingInflacionFilaVista {
  productoId: number;
  descripcion: string;
  costoInicial: string;
  costoFinal: string;
  variacion: string;
  /** true = el costo subió (desfavorable). */
  variacionPositiva: boolean;
  totalCompras: number;
  rank: number;
}

export interface RankingInflacionVista {
  chartOptions: EChartsOption;
  filas: RankingInflacionFilaVista[];
  hayDatos: boolean;
  titulo: string;
}
