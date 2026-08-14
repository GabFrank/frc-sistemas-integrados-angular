import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { crearValeConfirmadoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CrearValeConfirmadoGQL extends Mutation<Response> {
  document = crearValeConfirmadoMutation;
}
