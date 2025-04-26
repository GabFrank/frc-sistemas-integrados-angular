import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Cheque } from '../cheque.model';
import { saveCheque } from './graphql-query';

export interface Response {
  data: Cheque;
}

@Injectable({
  providedIn: 'root',
})
export class SaveChequeGQL extends Mutation<Response> {
  document = saveCheque;
} 