import { EChartsOption } from "echarts";
import { FormaPagoDetalleProcesado } from "./forma-pago-detalle-procesado.model";

export interface FormaPagoPantalla {
  cargando: boolean;
  datosListos: boolean;
  opciones: EChartsOption | null;
  hayDatos: boolean;
  detalles: FormaPagoDetalleProcesado[];
  totalMonto: string;
  totalTransacciones: string;
}
