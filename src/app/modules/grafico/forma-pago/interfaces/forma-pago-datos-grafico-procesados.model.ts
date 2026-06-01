import { EChartsOption } from "echarts";
import { FormaPagoDetalleProcesado } from "./forma-pago-detalle-procesado.model";

export interface FormaPagoDatosGraficoProcesados {
  opciones: EChartsOption;
  detalles: FormaPagoDetalleProcesado[];
  totalMonto: string;
  totalTransacciones: string;
  hayDatos: boolean;
}
