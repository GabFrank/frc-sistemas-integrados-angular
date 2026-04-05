import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PreGasto } from '../models/pre-gasto.model';
import { autorizarPreGastoMutation } from './graphql-query';

export interface Response {
  data: PreGasto;
}

@Injectable({
  providedIn: 'root',
})
export class AutorizarPreGastoGQL extends Mutation<Response> {
  document = autorizarPreGastoMutation;
}
