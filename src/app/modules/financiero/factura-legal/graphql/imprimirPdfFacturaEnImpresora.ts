import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { imprimirPdfFacturaEnImpresoraMutation } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirPdfFacturaEnImpresoraGQL extends Mutation<Response> {
  document = imprimirPdfFacturaEnImpresoraMutation;
}
