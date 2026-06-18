import { EChartsOption } from "echarts";

export interface VistaGraficoShell {
  opciones: EChartsOption | null;
  hayDatos: boolean;
  cargando: boolean;
  datosListos: boolean;
}

export const VISTA_GRAFICO_INICIAL: VistaGraficoShell = {
  opciones: null,
  hayDatos: false,
  cargando: false,
  datosListos: false,
};
