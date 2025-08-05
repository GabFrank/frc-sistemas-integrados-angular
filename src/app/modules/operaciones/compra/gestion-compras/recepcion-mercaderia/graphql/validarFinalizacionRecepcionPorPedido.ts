import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { VALIDAR_FINALIZACION_RECEPCION_POR_PEDIDO_MUTATION } from './recepcion-mercaderia-graphql-query';

export interface ValidarFinalizacionRecepcionPorPedidoVariables {
  pedidoId: number;
  sucursalesIds: number[];
}

export interface ItemPendiente {
  itemId: number;
  descripcionProducto: string;
  numeroNota: string;
  motivo: string;
  cantidadEsperada: number;
  cantidadRecibida: number;
  cantidadRechazada: number;
}

export interface ValidacionFinalizacionRecepcion {
  puedeFinalizar: boolean;
  itemsPendientes: ItemPendiente[];
  cantidadItemsPendientes: number;
  mensaje: string;
}

export interface ValidarFinalizacionRecepcionPorPedidoResponse {
  data: ValidacionFinalizacionRecepcion;
}

@Injectable({
  providedIn: 'root'
})
export class ValidarFinalizacionRecepcionPorPedidoGQL extends Mutation<ValidarFinalizacionRecepcionPorPedidoResponse, ValidarFinalizacionRecepcionPorPedidoVariables> {
  document = VALIDAR_FINALIZACION_RECEPCION_POR_PEDIDO_MUTATION;
} 