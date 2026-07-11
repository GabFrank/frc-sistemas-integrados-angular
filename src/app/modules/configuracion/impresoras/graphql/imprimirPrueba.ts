import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { imprimirPruebaMutation } from './graphql-query';

export interface Response {
  imprimirPruebaEnImpresora: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirPruebaGQL extends Mutation<Response> {
  document = imprimirPruebaMutation;
}
