import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { crearValeEnEspecieMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CrearValeEnEspecieGQL extends Mutation<Response> {
  document = crearValeEnEspecieMutation;
}
