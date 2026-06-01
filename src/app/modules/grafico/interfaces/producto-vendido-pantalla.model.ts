import { EChartsOption } from "echarts";
import { ProductoVendidoDetalleProcesado } from "./producto-vendido-detalle-procesado.model";

export interface ProductoVendidoPantalla {
  cargando: boolean;
  datosListos: boolean;
  opciones: EChartsOption | null;
  hayDatos: boolean;
  detalles: ProductoVendidoDetalleProcesado[];
  totalMonto: string;
}
