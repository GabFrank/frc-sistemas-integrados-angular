import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deletePedidoItemMutation } from './pedido-item-graphql-query';

export interface DeletePedidoItemVariables {
  id: number;
}

export interface DeletePedidoItemResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeletePedidoItemGQL extends Mutation<DeletePedidoItemResponse, DeletePedidoItemVariables> {
  document = deletePedidoItemMutation;
} 