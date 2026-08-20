import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { revocarAccesoCajaMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class RevocarAccesoCajaGQL extends Mutation<Response> {
  document = revocarAccesoCajaMutation;
}
