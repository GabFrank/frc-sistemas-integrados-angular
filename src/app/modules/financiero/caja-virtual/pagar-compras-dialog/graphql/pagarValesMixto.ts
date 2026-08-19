import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { pagarValesMixtoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class PagarValesMixtoGQL extends Mutation<Response> {
  document = pagarValesMixtoMutation;
}
