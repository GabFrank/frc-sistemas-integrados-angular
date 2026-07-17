import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { imprimirTicketFacturaEnImpresoraMutation } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirTicketFacturaEnImpresoraGQL extends Mutation<Response> {
  document = imprimirTicketFacturaEnImpresoraMutation;
}
