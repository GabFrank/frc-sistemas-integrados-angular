import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Pedido } from '../pedido.model';
import { pedidoQuery } from './graphql-query';

export interface GetPedidoVariables {
  id: number;
}

export interface GetPedidoResponse {
  data: Pedido;
}

@Injectable({
  providedIn: 'root',
})
export class GetPedidoGQL extends Query<GetPedidoResponse, GetPedidoVariables> {
  document = pedidoQuery;
} 