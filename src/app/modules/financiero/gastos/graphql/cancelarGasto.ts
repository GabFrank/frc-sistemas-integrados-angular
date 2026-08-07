import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cancelarGasto } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CancelarGastoGQL extends Mutation<Response> {
  document = cancelarGasto;
}
