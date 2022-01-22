import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { saveNotaRecepcion } from './graphql-query';

export interface Response {
  data: NotaRecepcion;
}

@Injectable({
  providedIn: 'root',
})
export class SaveNotaRecepcionGQL extends Mutation<Response> {
  document = saveNotaRecepcion;
}
