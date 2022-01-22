import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { PedidoItem } from '../edit-pedido/pedido-item.model';
import { updateNotaRecepcionQuery } from './graphql-query';

export interface Response {
  data: PedidoItem;
}

@Injectable({
  providedIn: 'root',
})
export class UpdateNotaRecepcionIdGQL extends Mutation<Response> {
  document = updateNotaRecepcionQuery;
}
