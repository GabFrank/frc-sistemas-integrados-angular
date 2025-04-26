import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { PedidoItem } from '../edit-pedido/pedido-item.model';
import { pedidoItemPorPedidoPageQuery } from './graphql-query';

export interface Response {
  data: PageInfo<PedidoItem>;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoItemPorPedidoPageGQL extends Query<Response> {
  document = pedidoItemPorPedidoPageQuery;
}
