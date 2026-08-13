import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { operacionesFinancierasQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class OperacionesFinancierasGQL extends Query<Response> {
  document = operacionesFinancierasQuery;
}
