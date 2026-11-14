import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { saldoDisponibleTesoreriaQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class SaldoDisponibleTesoreriaGQL extends Query<Response> {
  document = saldoDisponibleTesoreriaQuery;
}
