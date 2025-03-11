import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { Producto } from "../../../productos/producto/producto.model";
import { CompraItem } from "../../compra/compra-item.model";
import { NotaRecepcion } from "../nota-recepcion/nota-recepcion.model";
import { PedidoItemSucursal } from "../pedido-item-sucursal/pedido-item-sucursal.model";
import { PedidoItemEstado } from "./pedido-enums";
import { Pedido } from "./pedido.model";

export class PedidoItem {
  id: number;
  pedido: Pedido;
  producto: Producto;
  presentacionCreacion: Presentacion;
  cantidadCreacion: number;
  precioUnitarioCreacion: number;
  descuentoUnitarioCreacion: number;
  valorTotal: number;
  bonificacion: boolean;
  bonificacionDetalle: string;
  observacion: string;
  lote: string;
  frio: boolean;
  vencimientoCreacion: Date;
  estado: PedidoItemEstado;
  creadoEn: Date;
  usuarioCreacion: Usuario;
  notaRecepcion: NotaRecepcion;
  compraItem: CompraItem;
  precioUnitarioRecepcionNota: number;
  descuentoUnitarioRecepcionNota: number;
  vencimientoRecepcionNota: Date;
  presentacionRecepcionNota: Presentacion;
  cantidadRecepcionNota: number;
  precioUnitarioRecepcionProducto: number;
  descuentoUnitarioRecepcionProducto: number;
  vencimientoRecepcionProducto: Date;
  presentacionRecepcionProducto: Presentacion;
  cantidadRecepcionProducto: number;
  usuarioRecepcionNota: Usuario;
  usuarioRecepcionProducto: Usuario;
  obsCreacion: string;
  obsRecepcionNota: string;
  obsRecepcionProducto: string;
  autorizacionRecepcionNota;
  autorizacionRecepcionProducto;
  autorizadoPorRecepcionNota: Usuario;
  autorizadoPorRecepcionProducto: Usuario;
  motivoModificacionRecepcionNota: string;
  motivoModificacionRecepcionProducto: string;
  cancelado: boolean;
  verificadoRecepcionNota: boolean;
  verificadoRecepcionProducto: boolean;
  presentacion: Presentacion;
  precioUnitario: number;
  cantidad: number;
  descuentoUnitario: number;
  motivoRechazoRecepcionNota: string
  motivoRechazoRecepcionProducto: string
  pedidoItemSucursalList: PedidoItemSucursal[] = [];
  isDistribucionSucursalesCreacion: boolean;
  isDistribucionSucursalesRecepcion: boolean;

  toInput(): PedidoItemInput {
    let input = new PedidoItemInput();
    input.id = this.id;
    input.pedidoId = this.pedido?.id;
    input.productoId = this.producto?.id;
    input.presentacionCreacionId = this.presentacionCreacion?.id;
    input.cantidadCreacion = this.cantidadCreacion;
    input.precioUnitarioCreacion = this.precioUnitarioCreacion;
    input.descuentoUnitarioCreacion = this.descuentoUnitarioCreacion;
    input.valorTotal = this.valorTotal;
    input.bonificacion = this.bonificacion;
    input.observacion = this.observacion;
    input.lote = this.lote;
    input.vencimientoCreacion = dateToString(this.vencimientoCreacion);
    input.estado = this.estado;
    input.creadoEn = dateToString(this.creadoEn);
    input.usuarioCreacionId = this.usuarioCreacion?.id;
    input.notaRecepcionId = this.notaRecepcion?.id;
    input.precioUnitarioRecepcionNota = this.precioUnitarioRecepcionNota;
    input.descuentoUnitarioRecepcionNota = this.descuentoUnitarioRecepcionNota;
    input.vencimientoRecepcionNota = dateToString(
      this.vencimientoRecepcionNota
    );
    input.presentacionRecepcionNotaId = this.presentacionRecepcionNota?.id;
    input.cantidadRecepcionNota = this.cantidadRecepcionNota;
    input.precioUnitarioRecepcionProducto =
      this.precioUnitarioRecepcionProducto;
    input.descuentoUnitarioRecepcionProducto =
      this.descuentoUnitarioRecepcionProducto;
    input.vencimientoRecepcionProducto = dateToString(
      this.vencimientoRecepcionProducto
    );
    input.presentacionRecepcionProductoId =
      this.presentacionRecepcionProducto?.id;
    input.cantidadRecepcionProducto = this.cantidadRecepcionProducto;
    input.usuarioRecepcionNotaId = this.usuarioRecepcionNota?.id;
    input.usuarioRecepcionProductoId = this.usuarioRecepcionProducto?.id;
    input.obsCreacion = this.obsCreacion;
    input.obsRecepcionNota = this.obsRecepcionNota;
    input.obsRecepcionProducto = this.obsRecepcionProducto;
    input.autorizacionRecepcionNota = this.autorizacionRecepcionNota;
    input.autorizacionRecepcionProducto = this.autorizacionRecepcionProducto;
    input.autorizadoPorRecepcionNotaId = this.autorizadoPorRecepcionNota?.id;
    input.autorizadoPorRecepcionProductoId =
      this.autorizadoPorRecepcionProducto?.id;
    input.motivoModificacionRecepcionNota =
      this.motivoModificacionRecepcionNota;
    input.motivoModificacionRecepcionProducto =
      this.motivoModificacionRecepcionProducto;
    input.cancelado = this.cancelado;
    input.verificadoRecepcionNota = this.verificadoRecepcionNota;
    input.verificadoRecepcionProducto = this.verificadoRecepcionProducto;
    input.motivoRechazoRecepcionNota = this.motivoRechazoRecepcionNota;
    input.motivoRechazoRecepcionProducto = this.motivoRechazoRecepcionProducto;
    return input;
  }
}

export class PedidoItemInput {
  id: number;
  pedidoId: number;
  productoId: number;
  presentacionCreacionId: number;
  cantidadCreacion: number;
  precioUnitarioCreacion: number;
  descuentoUnitarioCreacion: number;
  valorTotal: number;
  bonificacion: boolean;
  observacion: string;
  lote: string;
  frio: boolean;
  bonificacionDetalle: string;
  vencimientoCreacion: string;
  estado: PedidoItemEstado;
  creadoEn: string;
  usuarioCreacionId: number;
  notaRecepcionId: number;
  precioUnitarioRecepcionNota: number;
  descuentoUnitarioRecepcionNota: number;
  vencimientoRecepcionNota: string;
  presentacionRecepcionNotaId: number;
  cantidadRecepcionNota: number;
  precioUnitarioRecepcionProducto: number;
  descuentoUnitarioRecepcionProducto: number;
  vencimientoRecepcionProducto: string;
  presentacionRecepcionProductoId: number;
  cantidadRecepcionProducto: number;
  usuarioRecepcionNotaId: number;
  usuarioRecepcionProductoId: number;
  obsCreacion: string;
  obsRecepcionNota: string;
  obsRecepcionProducto: string;
  autorizacionRecepcionNota;
  autorizacionRecepcionProducto;
  autorizadoPorRecepcionNotaId: number;
  autorizadoPorRecepcionProductoId: number;
  motivoModificacionRecepcionNota: string;
  motivoModificacionRecepcionProducto: string;
  cancelado: boolean;
  verificadoRecepcionNota: boolean;
  verificadoRecepcionProducto: boolean;
  motivoRechazoRecepcionNota: string
  motivoRechazoRecepcionProducto: string
}


export enum PedidoItemMotivoModificacion {
  PRODUCTO_INCORRECTO = 'Producto incorrecto',
  PRESENTACION_INCORRECTA = 'Presentacion incorrecta',
  PRECIO_UNITARIO_INCORRECTO = 'Precio unitario incorrecto',
  CANTIDAD_INCORRECTA = 'Cantidad incorrecta',
  VENCIMIENTO_INCORRECTO = 'Vencimiento incorrecto',
  BONIFICACION_INCORRECTA = 'Borificacion incorrecta',
  OTRO = 'Otro'
}

export enum PedidoItemMotivoRechazo {
  PRODUCTO_INCORRECTO = 'Producto incorrecto',
  FALTA_PRODUCTO = 'Falta producto',
  PRODUCTO_VENCIDO = 'Producto vencido',
  PRODUCTO_AVERIADO = 'Producto averiado',
  PRECIO_INCORRECTO = 'Precio incorrecto',
  OTRO = 'Otro'
}