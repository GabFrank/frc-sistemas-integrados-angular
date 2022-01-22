import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Pedido } from '../edit-pedido/pedido.model';
import { pedidoItemQuery } from '../pedido-itens/graphql/graphql-query';
import { filterPedidosQuery, pedidoInfoCompletaQuery, savePedido } from './graphql-query';

export interface Response {
  data: Pedido;
}

@Injectable({
  providedIn: 'root',
})
export class SavePedidoGQL extends Mutation<Response> {
  document = savePedido;
}
