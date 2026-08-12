import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Cheque } from '../cheque.model';
import { anularChequeMutation } from './graphql-query';

export interface Response {
  data: Cheque;
}

@Injectable({
  providedIn: 'root',
})
export class AnularChequeGQL extends Mutation<Response> {
  document = anularChequeMutation;
}
