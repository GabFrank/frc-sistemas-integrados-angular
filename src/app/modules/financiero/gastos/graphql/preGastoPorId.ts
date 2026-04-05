import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PreGasto } from '../models/pre-gasto.model';
import { preGastoQuery } from './graphql-query';

export interface Response {
  data: PreGasto;
}

@Injectable({
  providedIn: 'root',
})
export class PreGastoPorIdGQL extends Query<Response> {
  document = preGastoQuery;
}
