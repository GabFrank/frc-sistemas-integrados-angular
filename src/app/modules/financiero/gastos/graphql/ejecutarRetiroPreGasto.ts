import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PreGasto } from '../models/pre-gasto.model';
import { ejecutarRetiroPreGastoMutation } from './graphql-query';

export interface Response {
  data: PreGasto;
}

@Injectable({ providedIn: 'root' })
export class EjecutarRetiroPreGastoGQL extends Mutation<Response> {
  document = ejecutarRetiroPreGastoMutation;
}
