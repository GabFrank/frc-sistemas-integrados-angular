import { AnalisisProductoNivelVenta } from "./analisis-producto-nivel-venta.type";

export interface AnalisisProductoProductoDetalle {
  productoId: string;
  descripcion: string;
  cantidad: number;
  totalMonto: number;
  cantidadFormateada: string;
  montoFormateado: string;
  porcentaje: number;
  nivel: AnalisisProductoNivelVenta;
  nivelLabel: string;
  color: string;
  rank: number;
}
