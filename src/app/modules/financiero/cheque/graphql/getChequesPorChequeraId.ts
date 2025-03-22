import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cheque } from '../cheque.model';
import { chequesPorChequeraIdQuery } from './graphql-query';

export interface Response {
  data: Cheque[];
}

@Injectable({
  providedIn: 'root',
})
export class GetChequesPorChequeraIdGQL extends Query<Response> {
  document = chequesPorChequeraIdQuery;
} 