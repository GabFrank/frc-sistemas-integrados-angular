import { Moneda } from '../../../../modules/financiero/moneda/moneda.model';
import { Proveedor } from '../../../../modules/personas/proveedor/proveedor.model';
import { Usuario } from '../../../../modules/personas/usuarios/usuario.model';
import { PedidoItem } from '../../../../modules/operaciones/pedido/edit-pedido/pedido-item.model';
import { FormaPago } from '../../../financiero/forma-pago/forma-pago.model';
import { PedidoEstado } from './pedido-enums';
import { Vendedor } from '../../../personas/vendedor/vendedor.model';

export class Pedido {
  id: number;
  proveedor: Proveedor;
  vendedor: Vendedor;
  fechaDeEntrega: Date;
  formaPago: FormaPago;
  estado: PedidoEstado;
  moneda: Moneda;
  plazoCredito: number;
  creadoEn: Date;
  usuario: Usuario;
  descuento: number;
  pedidoItens: PedidoItem[];
  valorTotal: number;
}


export class PedidoInput {
  id: number;
  proveedorId: number;
  vendedorId: number;
  fechaDeEntrega: Date;
  formaPagoId: number;
  estado: PedidoEstado;
  monedaId: number;
  plazoCredito: number;
  creadoEn: Date;
  usuarioId: number;
  descuento: number;
  valorTotal: number;
}
