import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { notaRecepcionPorPedidoIdQuery } from './graphql-query';

export interface NotaRecepcionPorPedidoIdResponse {
  data: NotaRecepcion[];
}

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionPorPedidoIdGQL extends Query<NotaRecepcionPorPedidoIdResponse> {
  document = notaRecepcionPorPedidoIdQuery;
}
