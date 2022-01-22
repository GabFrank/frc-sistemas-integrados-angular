import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { Producto } from "../../../productos/producto/producto.model";
import { CompraItem } from "../../compra/compra-item.model";
import { NotaRecepcion } from "../nota-recepcion/nota-recepcion.model";
import { PedidoItemEstado } from "./pedido-enums";
import { Pedido } from "./pedido.model";

export class PedidoItem {
  id: number;
  pedido: Pedido;
  producto: Producto;
  presentacion: Presentacion
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario: number;
  valorTotal: number;
  bonificacion: boolean;
  bonificacionDetalle: string
  observacion: string;
  lote: string;
  frio: boolean
  vencimiento: Date;
  estado: PedidoItemEstado;
  creadoEn: Date;
  usuario: Usuario;
  notaRecepcion: NotaRecepcion
  compraItem: CompraItem;


  toInput(): PedidoItemInput {
    let input = new PedidoItemInput()
    input.id = this.id;
    input.pedidoId = this.pedido?.id
    input.productoId = this.producto?.id
    input.presentacionId = this.presentacion?.id
    input.cantidad= this.cantidad
    input.precioUnitario = this.precioUnitario
    input.descuentoUnitario = this.descuentoUnitario
    input.valorTotal = this.valorTotal
    input.bonificacion = this.bonificacion
    input.observacion = this.observacion
    input.lote = this.lote
    input.vencimiento = this.vencimiento
    input.estado = this.estado;
    input.creadoEn = this.creadoEn
    input.usuarioId = this.usuario?.id
    input.notaRecepcionId = this.notaRecepcion?.id
    return input;
  }
}

export class PedidoItemInput {
  id: number;
  pedidoId: number;
  productoId: number;
  presentacionId: number
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario: number;
  valorTotal: number;
  bonificacion: boolean;
  observacion: string;
  lote: string;
  frio: boolean;
  bonificacionDetalle: string
  vencimiento: Date;
  estado: PedidoItemEstado;
  creadoEn: Date;
  usuarioId: number;
  notaRecepcionId: number;
}
