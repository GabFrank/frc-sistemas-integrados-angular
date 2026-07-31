import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { operacionFinancieraCategoriasQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class OperacionFinancieraCategoriasGQL extends Query<Response> {
  document = operacionFinancieraCategoriasQuery;
}
