import { EChartsOption } from "echarts";
import { ProductoVendidoDetalleProcesado } from "./producto-vendido-detalle-procesado.model";

export interface ProductoVendidoDatosGraficoProcesados {
  opciones: EChartsOption;
  detalles: ProductoVendidoDetalleProcesado[];
  totalMonto: string;
  hayDatos: boolean;
}
