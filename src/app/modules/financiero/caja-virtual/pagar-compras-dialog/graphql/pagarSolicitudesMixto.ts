import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { pagarSolicitudesMixtoMutation } from './graphql-query';
export interface Response { data: any; }
@Injectable({ providedIn: 'root' })
export class PagarSolicitudesMixtoGQL extends Mutation<Response> {
  document = pagarSolicitudesMixtoMutation;
}
