import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PedidoItem } from '../pedido-item.model';
import { pedidoItemsByPedidoPageQuery } from './pedido-item-graphql-query';
import { PageInfo } from '../../../../../app.component';

export interface GetPedidoItemsVariables {
  id: number;
  page: number;
  size: number;
}

export interface GetPedidoItemsResponse {
  data: PageInfo<PedidoItem>;
}

@Injectable({
  providedIn: 'root',
})
export class GetPedidoItemPorPedidoPageGQL extends Query<GetPedidoItemsResponse, GetPedidoItemsVariables> {
  document = pedidoItemsByPedidoPageQuery;
} 