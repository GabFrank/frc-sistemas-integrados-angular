import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { PedidoItem } from '../../edit-pedido/pedido-item.model';
import { pedidoInfoCompletaQuery } from '../../graphql/graphql-query';
import { deletePedidoItemQuery, pedidoItemPorPedidoIdQuery } from './graphql-query';


interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeletePedidoItemGQL extends Mutation<Response> {
  document = deletePedidoItemQuery;
}
