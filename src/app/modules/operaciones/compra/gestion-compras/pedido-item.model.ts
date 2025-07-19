import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Presentacion } from '../../../productos/presentacion/presentacion.model';
import { Producto } from '../../../productos/producto/producto.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { Pedido } from './pedido.model';

export enum PedidoItemEstado {
  ACTIVO = 'ACTIVO',
  CANCELADO = 'CANCELADO',
  DEVOLUCION = 'DEVOLUCION',
  CONCLUIDO = 'CONCLUIDO',
  EN_FALTA = 'EN_FALTA'
}

export class PedidoItem {
  id: number;
  pedido: Pedido;
  producto: Producto;
  presentacionCreacion: Presentacion;
  cantidadSolicitada: number;
  precioUnitarioSolicitado: number;
  vencimientoEsperado: Date;
  observacion: string;
  esBonificacion: boolean;
  estado: PedidoItemEstado;
  creadoEn: Date;
  usuarioCreacion: Usuario;

  // Campos adicionales para frontend (no están en GraphQL pero pueden ser útiles)
  presentacion?: Presentacion;
  precioUnitarioPorPresentacion?: number;
  distribucionConcluida?: boolean; // Status de distribución
  cantidadPendiente?: number; // Cantidad pendiente de conciliar

  toInput(): PedidoItemInput {
    let input = new PedidoItemInput();
    input.id = this?.id;
    input.pedidoId = this?.pedido?.id;
    input.productoId = this?.producto?.id;
    input.presentacionCreacionId = this?.presentacionCreacion?.id;
    input.cantidadSolicitada = this?.cantidadSolicitada;
    input.precioUnitarioSolicitado = this?.precioUnitarioSolicitado;
    input.vencimientoEsperado = dateToString(this?.vencimientoEsperado);
    input.observacion = this?.observacion;
    input.esBonificacion = this?.esBonificacion;
    input.estado = this?.estado;
    input.creadoEn = dateToString(this?.creadoEn);
    input.usuarioCreacionId = this?.usuarioCreacion?.id;
    return input;
  }
}

export class PedidoItemInput {
  id?: number;
  pedidoId?: number;
  productoId?: number;
  presentacionCreacionId?: number;
  cantidadSolicitada?: number;
  precioUnitarioSolicitado?: number;
  vencimientoEsperado?: string;
  observacion?: string;
  esBonificacion?: boolean;
  estado?: PedidoItemEstado;
  creadoEn?: string;
  usuarioCreacionId?: number;
} 