import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { FINALIZAR_RECEPCION_FISICA_POR_PEDIDO_MUTATION } from './recepcion-mercaderia-graphql-query';

export interface FinalizarRecepcionFisicaPorPedidoVariables {
  pedidoId: number;
  sucursalesIds: number[];
}

export interface FinalizarRecepcionFisicaPorPedidoResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FinalizarRecepcionFisicaPorPedidoGQL extends Mutation<FinalizarRecepcionFisicaPorPedidoResponse, FinalizarRecepcionFisicaPorPedidoVariables> {
  document = FINALIZAR_RECEPCION_FISICA_POR_PEDIDO_MUTATION;
} 