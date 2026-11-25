import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirChequeAnuladoQuery } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirChequeAnuladoGQL extends Query<Response> {
  document = imprimirChequeAnuladoQuery;
}
