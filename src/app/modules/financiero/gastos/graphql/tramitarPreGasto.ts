import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PreGasto } from '../models/pre-gasto.model';
import { tramitarPreGastoMutation } from './graphql-query';

export interface Response {
  data: PreGasto;
}

@Injectable({
  providedIn: 'root',
})
export class TramitarPreGastoGQL extends Mutation<Response> {
  document = tramitarPreGastoMutation;
}
