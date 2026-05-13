import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { reimprimirQuery } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ReimprimirGastoGQL extends Query<Response> {
  document = reimprimirQuery;
}
