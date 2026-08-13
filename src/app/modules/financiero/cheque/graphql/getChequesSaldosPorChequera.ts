import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ChequeSaldoChequera } from '../cheque.model';
import { chequesSaldosPorChequeraQuery } from './graphql-query';

export interface Response {
  data: ChequeSaldoChequera[];
}

@Injectable({
  providedIn: 'root',
})
export class GetChequesSaldosPorChequeraGQL extends Query<Response> {
  document = chequesSaldosPorChequeraQuery;
}
