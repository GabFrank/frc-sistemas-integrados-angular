import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { generarPenalizacionesAutoMutation } from './graphql-query';

export interface Response {
  data: number;
}

@Injectable({ providedIn: 'root' })
export class GenerarPenalizacionesAutoGQL extends Mutation<Response> {
  document = generarPenalizacionesAutoMutation;
}
