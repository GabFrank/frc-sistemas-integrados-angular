import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Cheque } from '../cheque.model';
import { emitirChequeMutation } from './graphql-query';

export interface Response {
  data: Cheque;
}

@Injectable({
  providedIn: 'root',
})
export class EmitirChequeGQL extends Mutation<Response> {
  document = emitirChequeMutation;
}
