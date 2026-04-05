import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PreGasto } from '../models/pre-gasto.model';
import { preGastosQuery } from './graphql-query';

export interface Response {
  data: PreGasto[];
}

@Injectable({
  providedIn: 'root',
})
export class PreGastosGQL extends Query<Response> {
  document = preGastosQuery;
}
