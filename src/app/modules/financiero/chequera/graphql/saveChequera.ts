import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Chequera } from '../chequera.model';
import { saveChequera } from './graphql-query';

export interface Response {
  data: Chequera;
}

@Injectable({
  providedIn: 'root',
})
export class SaveChequeraGQL extends Mutation<Response> {
  document = saveChequera;
} 