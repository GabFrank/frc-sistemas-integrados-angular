import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { generarPenalizacionesAutoRangoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class GenerarPenalizacionesAutoRangoGQL extends Mutation<Response> {
  document = generarPenalizacionesAutoRangoMutation;
}
