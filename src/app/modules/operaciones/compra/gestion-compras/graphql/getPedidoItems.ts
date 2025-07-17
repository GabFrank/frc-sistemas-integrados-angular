import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PedidoItem } from '../pedido-item.model';
import { pedidoItemsByPedidoQuery } from './pedido-item-graphql-query';

export interface GetPedidoItemsVariables {
  pedidoId: number;
}

export interface GetPedidoItemsResponse {
  data: PedidoItem[];
}

@Injectable({
  providedIn: 'root',
})
export class GetPedidoItemsGQL extends Query<GetPedidoItemsResponse, GetPedidoItemsVariables> {
  document = pedidoItemsByPedidoQuery;
} 