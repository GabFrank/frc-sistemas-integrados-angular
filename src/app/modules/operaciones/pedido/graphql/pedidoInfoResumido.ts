import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Pedido } from '../edit-pedido/pedido.model';
import { pedidoItemQuery } from '../pedido-itens/graphql/graphql-query';
import { pedidosResumidoQuery } from './graphql-query';

export interface Response {
  data: Pedido;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoInfoResumidoGQL extends Query<Response> {
  document = pedidosResumidoQuery;
}
