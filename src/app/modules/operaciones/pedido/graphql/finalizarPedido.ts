import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Pedido } from '../edit-pedido/pedido.model';
import { pedidoItemQuery } from '../pedido-itens/graphql/graphql-query';
import { filterPedidosQuery, finalizarPedido, pedidoInfoCompletaQuery, savePedido } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class FinalizarPedidoGQL extends Mutation<Pedido> {
  document = finalizarPedido;
}
