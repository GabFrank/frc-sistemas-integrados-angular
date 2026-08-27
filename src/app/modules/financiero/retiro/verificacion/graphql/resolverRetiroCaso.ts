import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { resolverRetiroCasoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ResolverRetiroCasoGQL extends Mutation<Response> {
  document = resolverRetiroCasoMutation;
}
