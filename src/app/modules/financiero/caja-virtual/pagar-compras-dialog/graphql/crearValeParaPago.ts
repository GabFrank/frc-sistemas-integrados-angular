import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { crearValeParaPagoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CrearValeParaPagoGQL extends Mutation<Response> {
  document = crearValeParaPagoMutation;
}
