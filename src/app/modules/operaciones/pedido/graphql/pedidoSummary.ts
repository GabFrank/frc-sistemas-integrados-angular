import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PedidoSummary } from '../edit-pedido/pedido.model';
import { pedidoSummaryQuery } from './graphql-query';

export interface Response {
  data: PedidoSummary;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoSummaryGQL extends Query<Response> {
  document = pedidoSummaryQuery;
} 