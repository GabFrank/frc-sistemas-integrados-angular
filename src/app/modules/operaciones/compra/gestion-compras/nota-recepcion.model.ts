import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Pedido } from './pedido.model';
import { PedidoItem } from './pedido-item.model';
import { Compra } from '../compra.model';
import { Documento } from '../../../financiero/documento/documento.model';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { Producto } from '../../../productos/producto/producto.model';
import { Presentacion } from '../../../productos/presentacion/presentacion.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export enum NotaRecepcionEstado {
  PENDIENTE_CONCILIACION = 'PENDIENTE_CONCILIACION',
  CONCILIADA = 'CONCILIADA',
  EN_RECEPCION = 'EN_RECEPCION',
  RECEPCION_PARCIAL = 'RECEPCION_PARCIAL',
  RECEPCION_COMPLETA = 'RECEPCION_COMPLETA',
  CERRADA = 'CERRADA'
}

export class NotaRecepcion {
  id: number;
  pedido: Pedido;
  compra: Compra;
  documento: Documento;
  numero: number;
  tipoBoleta: string;
  timbrado: number;
  fecha: Date;
  moneda: Moneda;
  cotizacion: number;
  estado: NotaRecepcionEstado;
  pagado: boolean;
  esNotaRechazo: boolean;
  creadoEn: Date;
  usuario: Usuario;
  valorTotal?: number; // Campo para el valor total calculado

  toInput(): NotaRecepcionInput {
    let input = new NotaRecepcionInput();
    input.id = this?.id || undefined;
    input.pedidoId = this?.pedido?.id || undefined;
    input.compraId = this?.compra?.id || undefined;
    input.documentoId = this?.documento?.id || undefined;
    input.numero = this?.numero || 0;
    input.tipoBoleta = this?.tipoBoleta || '';
    input.timbrado = this?.timbrado || undefined;
    input.fecha = dateToString(this?.fecha);
    input.monedaId = this?.moneda?.id || 0;
    input.cotizacion = this?.cotizacion || 0;
    input.estado = this?.estado || NotaRecepcionEstado.PENDIENTE_CONCILIACION;
    input.pagado = this?.pagado || false;
    input.esNotaRechazo = this?.esNotaRechazo || false;
    input.creadoEn = dateToString(this?.creadoEn);
    input.usuarioId = this?.usuario?.id || undefined;
    return input;
  }
}

export class NotaRecepcionInput {
  id?: number;
  pedidoId?: number;
  compraId?: number;
  documentoId?: number;
  numero: number;
  tipoBoleta: string;
  timbrado?: number;
  fecha: string;
  monedaId: number;
  cotizacion: number;
  estado: NotaRecepcionEstado;
  pagado: boolean;
  esNotaRechazo: boolean;
  creadoEn?: string;
  usuarioId?: number;
}

export enum NotaRecepcionItemEstado {
  PENDIENTE_CONCILIACION = 'PENDIENTE_CONCILIACION',
  CONCILIADO = 'CONCILIADO',
  RECHAZADO = 'RECHAZADO',
  DISCREPANCIA = 'DISCREPANCIA'
}

export class NotaRecepcionItem {
  id: number;
  notaRecepcion: NotaRecepcion;
  pedidoItem: PedidoItem;
  producto: Producto;
  presentacionEnNota: Presentacion | null;
  cantidadEnNota: number;
  precioUnitarioEnNota: number;
  esBonificacion: boolean;
  vencimientoEnNota: Date;
  observacion: string;
  estado: NotaRecepcionItemEstado;
  motivoRechazo: string;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): NotaRecepcionItemInput {
    let input = new NotaRecepcionItemInput();
    input.id = this?.id;
    input.notaRecepcionId = this?.notaRecepcion?.id;
    input.pedidoItemId = this?.pedidoItem?.id;
    input.productoId = this?.producto?.id;
    input.presentacionEnNotaId = this?.presentacionEnNota?.id;
    input.cantidadEnNota = this?.cantidadEnNota;
    input.precioUnitarioEnNota = this?.precioUnitarioEnNota;
    input.esBonificacion = this?.esBonificacion;
    input.vencimientoEnNota = dateToString(this?.vencimientoEnNota);
    input.observacion = this?.observacion;
    input.estado = this?.estado;
    input.motivoRechazo = this?.motivoRechazo;
    input.creadoEn = dateToString(this?.creadoEn);
    input.usuarioId = this?.usuario?.id;
    return input;
  }
}

export class NotaRecepcionItemInput {
  id: number;
  notaRecepcionId: number;
  pedidoItemId: number;
  productoId: number;
  presentacionEnNotaId: number;
  cantidadEnNota: number;
  precioUnitarioEnNota: number;
  esBonificacion: boolean;
  vencimientoEnNota: string;
  observacion: string;
  estado: NotaRecepcionItemEstado;
  motivoRechazo: string;
  creadoEn: string;
  usuarioId: number;
} 

export enum TipoBoleta {
  FACTURA = 'FACTURA',
  COMUN = 'COMUN'
}