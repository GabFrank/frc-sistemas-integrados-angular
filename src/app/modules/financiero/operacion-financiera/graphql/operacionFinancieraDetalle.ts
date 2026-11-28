import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { operacionFinancieraDetalleQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class OperacionFinancieraDetalleGQL extends Query<Response> {
  document = operacionFinancieraDetalleQuery;
}
