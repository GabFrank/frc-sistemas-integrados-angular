import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PedidoItem, PedidoItemInput } from '../pedido-item.model';
import { savePedidoItemMutation } from './pedido-item-graphql-query';

export interface SavePedidoItemVariables {
  input: PedidoItemInput;
}

export interface SavePedidoItemResponse {
  data: PedidoItem;
}

@Injectable({
  providedIn: 'root',
})
export class SavePedidoItemGQL extends Mutation<SavePedidoItemResponse, SavePedidoItemVariables> {
  document = savePedidoItemMutation;
} 