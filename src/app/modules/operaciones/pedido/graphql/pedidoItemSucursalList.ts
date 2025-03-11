import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PedidoItem } from '../edit-pedido/pedido-item.model';
import { pedidoItemPedidoItemSucursalListQuery } from './graphql-query';

export interface Response {
  data: PedidoItem;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoItemSucursalListGQL extends Query<Response> {
  document = pedidoItemPedidoItemSucursalListQuery;
} 