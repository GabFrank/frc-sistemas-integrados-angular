import { Documento } from '../../financiero/documento/documento.model';
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
  formaPago: FormaPago;
  valorParcial: number;
  descuento: number;
  valorTotal: number;
  usuario: Usuario;

  toInput(): CompraInput {
    let input = new CompraInput;
    input.id = this.id
    input.pedidoId = this.pedido?.id
    input.proveedorId = this.proveedor?.id
    input.estado = this.estado;
    input.fecha = this.fecha;
    input.formaPagoId = this.formaPago?.id
    input.valorParcial = this.valorParcial
    input.descuento = this.descuento
    input.valorTotal = this.valorTotal
    input.usuarioId = this.usuario?.id
    return input;
  }
}

export class CompraInput {
  id: number;
  pedidoId: number;
  proveedorId: number;
  estado: CompraEstado;
  fecha: Date;
  nroNota: string;
  formaPagoId: number;
  valorParcial: number;
  descuento: number;
  valorTotal: number;
  usuarioId: number;
}
