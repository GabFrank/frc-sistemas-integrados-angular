import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { crearGastoParaPagoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CrearGastoParaPagoGQL extends Mutation<Response> {
  document = crearGastoParaPagoMutation;
}
