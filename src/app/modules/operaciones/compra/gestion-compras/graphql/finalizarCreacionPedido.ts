import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { finalizarCreacionPedidoMutation } from './graphql-query';
import { Pedido } from '../pedido.model';

export interface FinalizarCreacionPedidoResponse {
  data: Pedido;
}

export interface FinalizarCreacionPedidoVariables {
  pedidoId: number;
}

@Injectable({
  providedIn: 'root',
})
export class FinalizarCreacionPedidoGQL extends Mutation<FinalizarCreacionPedidoResponse, FinalizarCreacionPedidoVariables> {
  document = finalizarCreacionPedidoMutation;
} 