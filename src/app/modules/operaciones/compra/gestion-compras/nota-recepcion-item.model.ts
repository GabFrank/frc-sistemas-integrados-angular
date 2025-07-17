import { NotaRecepcion } from './nota-recepcion.model';
import { PedidoItem } from './pedido-item.model';
import { Producto } from '../../../productos/producto/producto.model';
import { Presentacion } from '../../../productos/presentacion/presentacion.model';

export enum NotaRecepcionItemEstado {
  CONCILIADO = 'CONCILIADO',
  RECHAZADO = 'RECHAZADO'
}

export class NotaRecepcionItem {
  id: number;
  notaRecepcion: NotaRecepcion;
  pedidoItem: PedidoItem | null;
  producto: Producto;
  presentacionEnNota: Presentacion | null;
  cantidadEnNota: number;
  precioUnitarioEnNota: number;
  esBonificacion: boolean;
  vencimientoEnNota: Date;
  observacion: string | null;
  estado: NotaRecepcionItemEstado;
  motivoRechazo: string | null;

  constructor() {
    this.id = 0;
    this.notaRecepcion = new NotaRecepcion();
    this.pedidoItem = null;
    this.producto = new Producto();
    this.presentacionEnNota = null;
    this.cantidadEnNota = 0;
    this.precioUnitarioEnNota = 0;
    this.esBonificacion = false;
    this.vencimientoEnNota = new Date();
    this.observacion = null;
    this.estado = NotaRecepcionItemEstado.CONCILIADO;
    this.motivoRechazo = null;
  }

  // Método para convertir a objeto para GraphQL
  toInput(): any {
    return {
      id: this.id || undefined,
      notaRecepcionId: this.notaRecepcion?.id,
      pedidoItemId: this.pedidoItem?.id,
      productoId: this.producto?.id,
      presentacionEnNotaId: this.presentacionEnNota?.id,
      cantidadEnNota: this.cantidadEnNota,
      precioUnitarioEnNota: this.precioUnitarioEnNota,
      esBonificacion: this.esBonificacion,
      vencimientoEnNota: this.vencimientoEnNota?.toISOString(),
      observacion: this.observacion,
      estado: this.estado,
      motivoRechazo: this.motivoRechazo
    };
  }
} 