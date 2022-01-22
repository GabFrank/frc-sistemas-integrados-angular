import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { PedidoItem } from '../../edit-pedido/pedido-item.model';
import { pedidoItemQuery } from '../../pedido-itens/graphql/graphql-query';
import { NotaRecepcion } from '../nota-recepcion.model';
import { notaRecepcionQuery, saveNotaRecepcion } from './graphql-query';

export interface Response {
  data: PedidoItem;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoItemPorIdGQL extends Query<Response> {
  document = pedidoItemQuery;
}
