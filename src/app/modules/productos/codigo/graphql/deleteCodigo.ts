import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Codigo } from '../codigo.model';
import { codigoPorCodigo, deleteCodigoQuery, saveCodigo } from './graphql-query';


export interface Response {
  data: Codigo;
}


@Injectable({
  providedIn: 'root',
})
export class DeleteCodigoGQL extends Mutation<Response> {
  document = deleteCodigoQuery;
}


