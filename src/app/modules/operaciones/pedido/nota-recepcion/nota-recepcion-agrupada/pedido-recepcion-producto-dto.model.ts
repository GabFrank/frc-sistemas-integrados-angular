import { Producto } from "../../../../productos/producto/producto.model";

export class PedidoRecepcionProductoDto {
  producto: Producto;
  totalCantidadARecibirPorUnidad: number;
  totalCantidadRecibidaPorUnidad: number;
  estado: PedidoRecepcionProductoEstado;
}

export enum PedidoRecepcionProductoEstado {
  PENDIENTE = 'PENDIENTE',
  RECIBIDO = 'RECIBIDO',
  RECIBIDO_PARCIALMENTE = 'RECIBIDO_PARCIALMENTE'
}
