import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { countNotaRecepcionPorPedidoId, notaRecepcionPorPedidoIdQuery, notaRecepcionQuery, saveNotaRecepcion } from './graphql-query';

export interface Response {
  data: number;
}

@Injectable({
  providedIn: 'root',
})
export class CountNotaRecepcionPorPedidoIdGQL extends Query<Response> {
  document = countNotaRecepcionPorPedidoId;
}
