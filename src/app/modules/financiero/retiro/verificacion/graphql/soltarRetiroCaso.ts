import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { soltarRetiroCasoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class SoltarRetiroCasoGQL extends Mutation<Response> {
  document = soltarRetiroCasoMutation;
}
