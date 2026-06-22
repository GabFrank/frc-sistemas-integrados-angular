import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PreGasto } from '../models/pre-gasto.model';
import { preGastosParaRetiroQuery } from './graphql-query';

export interface Response {
  data: PreGasto[];
}

@Injectable({ providedIn: 'root' })
export class PreGastosParaRetiroGQL extends Query<Response> {
  document = preGastosParaRetiroQuery;
}
