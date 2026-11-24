import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cancelarGastoParaPagoMutation } from './graphql-query';
export interface Response { data: any; }
@Injectable({ providedIn: 'root' })
export class CancelarGastoParaPagoGQL extends Mutation<Response> {
  document = cancelarGastoParaPagoMutation;
}
