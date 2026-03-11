import { NotaRecepcion } from './nota-recepcion.model';
import { PedidoItem } from './pedido-item.model';
import { Producto } from '../../../productos/producto/producto.model';
import { Presentacion } from '../../../productos/presentacion/presentacion.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export enum NotaRecepcionItemEstado {
  PENDIENTE_CONCILIACION = 'PENDIENTE_CONCILIACION',
  CONCILIADO = 'CONCILIADO',
  RECHAZADO = 'RECHAZADO',
  DISCREPANCIA = 'DISCREPANCIA'
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

  // Campos adicionales para frontend (no están en GraphQL pero pueden ser útiles)
  distribucionConcluida?: boolean; // Status de distribución documental
  cantidadPendiente?: number; // Cantidad pendiente de recibir físicamente

  // Campos de recepción física (calculados por el backend)
  cantidadRecibida?: number; // Cantidad total recibida físicamente
  cantidadRechazada?: number; // Cantidad total rechazada físicamente
  estadoRecepcion?: string; // Estado de recepción: PENDIENTE, VERIFICADO, RECHAZADO, PARCIAL
  recepcionMercaderiaItems?: any[]; // Lista de recepciones físicas para este ítem

  // Propiedades computadas para UI (siguiendo regla de no funciones en templates)
  cantidadEsperadaComputed?: number; // Cantidad esperada basada en sucursales seleccionadas
  cantidadEsperadaEnPresentacionComputed?: number; // Cantidad esperada en unidades de presentación
  cantidadRecibidaEnPresentacionComputed?: number; // Cantidad recibida en unidades de presentación
  cantidadRechazadaEnPresentacionComputed?: number; // Cantidad rechazada en unidades de presentación
  mostrarCantidadTotalComputed?: boolean; // Si mostrar cantidad total vs esperada

  constructor() {
    this.id = 0;
    this.notaRecepcion = new NotaRecepcion();
    this.pedidoItem = null;
    this.producto = new Producto();
    this.presentacionEnNota = null;
    this.cantidadEnNota = 0;
    this.precioUnitarioEnNota = 0;
    this.esBonificacion = false;
    this.vencimientoEnNota = null;
    this.observacion = null;
    this.estado = NotaRecepcionItemEstado.PENDIENTE_CONCILIACION;
    this.motivoRechazo = null;
    
    // Inicializar campos de recepción física
    this.cantidadRecibida = 0;
    this.cantidadRechazada = 0;
    this.estadoRecepcion = 'PENDIENTE';
    this.recepcionMercaderiaItems = [];
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
      vencimientoEnNota: dateToString(this.vencimientoEnNota),
      observacion: this.observacion,
      estado: this.estado,
      motivoRechazo: this.motivoRechazo
    };
  }
} 