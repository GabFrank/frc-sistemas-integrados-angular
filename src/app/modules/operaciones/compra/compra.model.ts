import { FormaPago } from '../../financiero/forma-pago/forma-pago.model';
import { Proveedor } from '../../personas/proveedor/proveedor.model';
import { Usuario } from '../../personas/usuarios/usuario.model';
import { Pedido } from '../pedido/edit-pedido/pedido.model';
import { CompraEstado, TipoBoleta } from './compra-enums';

export class Compra {
  id: number;
  pedido: Pedido;
  proveedor: Proveedor;
  estado: CompraEstado;
  fecha: Date;
  tipoBoleta: TipoBoleta;
  nroNota: string;
  tipoPago: FormaPago;
  valorParcial: number;
  descuento: number;
  valorTotal: number;
  usuario: Usuario;
}
