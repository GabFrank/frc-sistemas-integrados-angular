import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { notaRecepcionPorPedidoIdQuery, notaRecepcionQuery, saveNotaRecepcion } from './graphql-query';

export interface Response {
  data: NotaRecepcion;
}

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionPorPedidoIdGQL extends Query<Response> {
  document = notaRecepcionPorPedidoIdQuery;
}
