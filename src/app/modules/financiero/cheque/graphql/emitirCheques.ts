import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Cheque } from '../cheque.model';
import { emitirChequesMutation } from './graphql-query';

export interface Response {
  data: Cheque[];
}

@Injectable({
  providedIn: 'root',
})
export class EmitirChequesGQL extends Mutation<Response> {
  document = emitirChequesMutation;
}
