import { Usuario } from '../../../../modules/personas/usuarios/usuario.model';
import { Producto } from '../../../../modules/productos/producto/producto.model';
import { PedidoItemSucursal } from '../pedido-itens/pedido-item-sucursal/pedido-item-sucursal.model';
import { PedidoItemEstado } from './pedido-enums';
import { Pedido } from './pedido.model';

export class PedidoItem {
  id: number;
  pedido: Pedido;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario: number;
  valorTotal: number;
  bonificacion: boolean;
  bonificacionDetalle: string;
  observacion: string;
  frio: boolean;
  estado: PedidoItemEstado;
  vencimiento: Date;
  creadoEn: Date;
  usuario: Usuario;
  pedidoItemSucursales: PedidoItemSucursal[]
}

export class PedidoItemInput {
  id:number;
  pedidoId: number
  productoId: number
  notaPedidoId: number
  cantidad: number
  precioUnitario: number
  descuentoUnitario: number
  bonificacion: Boolean
  bonificacionDetalle: String
  observacion: String
  frio: Boolean
  vencimiento: Date
  estado: PedidoItemEstado
  usuarioId: number
}
