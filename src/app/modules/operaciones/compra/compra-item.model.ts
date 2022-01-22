import { Usuario } from '../../personas/usuarios/usuario.model';
import { Presentacion } from '../../productos/presentacion/presentacion.model';
import { Producto } from '../../productos/producto/producto.model';
import { PedidoItem } from '../pedido/edit-pedido/pedido-item.model';
import { CompraItemEstado } from './compra-enums';
import { Compra } from './compra.model';

export class CompraItem {
  id: number;
  compra: Compra;
  producto: Producto;
  presentacion: Presentacion
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario: number;
  valorTotal: number;
  bonificacion: boolean;
  observacion: string;
  lote: string;
  vencimiento: Date;
  estado: CompraItemEstado;
  creadoEn: Date;
  usuario: Usuario;
  pedidoItem: PedidoItem;
  verificado: boolean

  toInput(): CompraItemInput {
    let input = new CompraItemInput()
    input.id = this.id;
    input.compraId = this.compra?.id
    input.productoId = this.producto?.id
    input.presentacionId = this.presentacion?.id
    input.cantidad= this.cantidad
    input.precioUnitario = this.precioUnitario
    input.descuentoUnitario = this.descuentoUnitario
    input.bonificacion = this.bonificacion
    input.observacion = this.observacion
    input.lote = this.lote
    input.vencimiento = this.vencimiento
    input.estado = this.estado;
    input.creadoEn = this.creadoEn
    input.usuarioId = this.usuario?.id
    input.pedidoItemId = this.pedidoItem?.id
    input.verificado = this.verificado
    return input;
  }

  toDetalleInutList(detalleList: CompraItem[]): CompraItemInput[]{
    let detalleInputList : CompraItemInput[] = []
    detalleList.forEach(d => {
      detalleInputList.push(d.toInput())
    })
    return detalleInputList;
  }
}

export class CompraItemInput {
  id: number;
  compraId: number;
  productoId: number;
  presentacionId: number
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario: number;
  valorTotal: number;
  bonificacion: boolean;
  observacion: string;
  lote: string;
  vencimiento: Date;
  estado: CompraItemEstado;
  creadoEn: Date;
  usuarioId: number;
  pedidoItemId: number;
  verificado: boolean

}
