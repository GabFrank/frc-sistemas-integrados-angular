import { VentasPorHoraItem } from "../../venta-sucursal/ventas-por-hora-item.model";

export interface VentasPorHoraSerieGrafico {
  sucId?: number | string | null;
  sucursalNombre?: string;
  etiqueta: string;
  fecha: string;
  datos: VentasPorHoraItem[];
}
