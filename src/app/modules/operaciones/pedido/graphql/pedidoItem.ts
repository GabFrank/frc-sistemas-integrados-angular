import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PedidoItem } from '../edit-pedido/pedido-item.model';
import { pedidoItemQuery } from './graphql-query';

export interface Response {
  data: PedidoItem;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoItemGQL extends Query<Response> {
  document = pedidoItemQuery;
} 