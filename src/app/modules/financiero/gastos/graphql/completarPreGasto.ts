import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PreGasto } from '../models/pre-gasto.model';
import { completarPreGastoMutation } from './graphql-query';

export interface Response {
  data: PreGasto;
}

@Injectable({
  providedIn: 'root',
})
export class CompletarPreGastoGQL extends Mutation<Response> {
  document = completarPreGastoMutation;
}
