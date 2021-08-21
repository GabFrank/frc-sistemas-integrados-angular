import { Moneda } from '../../../../modules/financiero/moneda/moneda.model';
import { Proveedor } from '../../../../modules/personas/proveedor/proveedor.model';
import { Usuario } from '../../../../modules/personas/usuarios/usuario.model';
import { PedidoItem } from '../../../../modules/operaciones/pedido/edit-pedido/pedido-item.model';
import { FormaPago, PedidoEstado } from './pedido-enums';
import { Vendedor } from '../../../../modules/personas/vendedor/graphql/vendedorSearchByPersona';

export class Pedido {
  id: number;
  proveedor: Proveedor;
  vendedor: Vendedor;
  nombreProveedor: string;
  fechaDeEntrega: Date;
  formaPago: FormaPago;
  estado: PedidoEstado;
  moneda: Moneda;
  diasCheque: number;
  creadoEn: Date;
  usuario: Usuario;
  nombreUsuario: string;
  descuento: number;
  pedidoItens: PedidoItem[];
  valorTotal: number;
}

export class PedidoFormModel {
  id: number
  vendedor: Vendedor;
  proveedor: Proveedor;
  fechaDeEntrega: Date;
  formaPago: FormaPago;
  estado: PedidoEstado;
  moneda: number;
  diasCheque: number;
  descuento: number;
  pedidoItens: PedidoItem[];
  valorTotal: number;
  usuario: number;
  isSoloProductosProveedor: boolean;
}

export class PedidoInput {
  id: number
  vendedorId: number;
  proveedorId: number;
  fechaDeEntrega: Date;
  formaPago: FormaPago;
  estado: PedidoEstado;
  monedaId: number;
  diasCheque: number;
  descuento: number;
  valorTotal: number;
  usuarioId: number;
}
