import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { pagarRrhhMixtoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class PagarRrhhMixtoGQL extends Mutation<Response> {
  document = pagarRrhhMixtoMutation;
}
