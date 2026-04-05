import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PreGasto } from '../models/pre-gasto.model';
import { savePreGastoMutation } from './graphql-query';

export interface Response {
  data: PreGasto;
}

@Injectable({
  providedIn: 'root',
})
export class SavePreGastoGQL extends Mutation<Response> {
  document = savePreGastoMutation;
}
