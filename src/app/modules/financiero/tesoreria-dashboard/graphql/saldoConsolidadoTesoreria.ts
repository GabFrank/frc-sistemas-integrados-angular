import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { saldoConsolidadoTesoreriaQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class SaldoConsolidadoTesoreriaGQL extends Query<Response> {
  document = saldoConsolidadoTesoreriaQuery;
}
