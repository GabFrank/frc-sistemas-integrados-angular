import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Cheque } from '../cheque.model';
import { cobrarChequeMutation } from './graphql-query';

export interface Response {
  data: Cheque;
}

@Injectable({
  providedIn: 'root',
})
export class CobrarChequeGQL extends Mutation<Response> {
  document = cobrarChequeMutation;
}
