import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { notaRecepcionQuery, saveNotaRecepcion } from './graphql-query';

export interface Response {
  data: NotaRecepcion;
}

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionPorIdGQL extends Query<Response> {
  document = notaRecepcionQuery;
}
