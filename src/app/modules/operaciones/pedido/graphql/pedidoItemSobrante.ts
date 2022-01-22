import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PedidoItem } from '../edit-pedido/pedido-item.model';
import { Pedido } from '../edit-pedido/pedido.model';
import { pedidoItemQuery } from '../pedido-itens/graphql/graphql-query';
import { filterPedidosQuery, pedidoInfoCompletaQuery, pedidoItemPorPedidoIdSobranteQuery } from './graphql-query';

export interface Response {
  data: PedidoItem[];
}

@Injectable({
  providedIn: 'root',
})
export class PedidoItemSobranteGQL extends Query<Response> {
  document = pedidoItemPorPedidoIdSobranteQuery;
}
