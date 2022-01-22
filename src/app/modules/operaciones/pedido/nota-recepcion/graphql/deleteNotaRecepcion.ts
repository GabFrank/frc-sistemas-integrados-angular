import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { deleteNotaRecepcionQuery, saveNotaRecepcion } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteNotaRecepcionGQL extends Mutation<Response> {
  document = deleteNotaRecepcionQuery;
}
