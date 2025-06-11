import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PedidoRecepcionNotaSummary } from '../edit-pedido/pedido.model';
import { pedidoRecepcionNotaSummaryQuery } from './graphql-query';

export interface Response {
  data: PedidoRecepcionNotaSummary;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoRecepcionNotaSummaryGQL extends Query<Response> {
  document = pedidoRecepcionNotaSummaryQuery;
} 