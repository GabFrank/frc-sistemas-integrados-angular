import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { otorgarAccesoCajaMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class OtorgarAccesoCajaGQL extends Mutation<Response> {
  document = otorgarAccesoCajaMutation;
}
