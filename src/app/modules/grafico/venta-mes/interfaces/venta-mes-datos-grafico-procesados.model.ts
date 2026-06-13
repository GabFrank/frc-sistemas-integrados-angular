import { EChartsOption } from "echarts";
import { VentaMesResumenAnho } from "./venta-mes-resumen-anho.model";

export interface VentaMesDatosGraficoProcesados {
  opciones: EChartsOption;
  resumen: VentaMesResumenAnho[];
}
