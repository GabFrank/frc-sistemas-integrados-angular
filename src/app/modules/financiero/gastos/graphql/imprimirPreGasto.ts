import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirPreGastoQuery } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirPreGastoGQL extends Query<Response> {
  document = imprimirPreGastoQuery;
}
