import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { imprimirPruebaEnImpresoraMutation } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirPruebaEnImpresoraGQL extends Mutation<Response> {
  document = imprimirPruebaEnImpresoraMutation;
}
