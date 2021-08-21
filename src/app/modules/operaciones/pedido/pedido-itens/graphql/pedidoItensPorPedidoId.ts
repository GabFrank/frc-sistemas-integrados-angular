import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PedidoItem } from '../../edit-pedido/pedido-item.model';
import { pedidoInfoCompletaQuery } from '../../graphql/graphql-query';
import { pedidoItemPorPedidoIdQuery } from './graphql-query';


export interface Response {
  data: PedidoItem[];
}

@Injectable({
  providedIn: 'root',
})
export class PedidoItensPorPedidoIdGQL extends Query<Response> {
  document = pedidoInfoCompletaQuery;
}
