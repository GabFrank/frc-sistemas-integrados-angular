import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { operacionFinancieraQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class OperacionFinancieraGQL extends Query<Response> {
  document = operacionFinancieraQuery;
}
