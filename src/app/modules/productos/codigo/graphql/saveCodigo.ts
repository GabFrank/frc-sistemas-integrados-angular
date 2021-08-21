import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Codigo } from '../codigo.model';
import { codigoPorCodigo, saveCodigo } from './graphql-query';


export interface Response {
  data: Codigo;
}


@Injectable({
  providedIn: 'root',
})
export class SaveCodigoGQL extends Mutation<Response> {
  document = saveCodigo;
}


