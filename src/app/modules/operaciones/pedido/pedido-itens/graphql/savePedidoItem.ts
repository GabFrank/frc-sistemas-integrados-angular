import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { PedidoItem } from '../../edit-pedido/pedido-item.model';
import { Pedido } from '../../edit-pedido/pedido.model';
import { pedidoInfoCompletaQuery } from '../../graphql/graphql-query';
import { deletePedidoItemQuery, pedidoItemPorPedidoIdQuery, savePedidoItem } from './graphql-query';


interface Response {
  data: Pedido;
}

@Injectable({
  providedIn: 'root',
})
export class SavePedidoItemGQL extends Mutation<Response> {
  document = savePedidoItem;
}
