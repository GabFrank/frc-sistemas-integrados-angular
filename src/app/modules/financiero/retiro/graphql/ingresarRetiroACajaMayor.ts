import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ingresarRetiroACajaMayorMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class IngresarRetiroACajaMayorGQL extends Mutation<Response> {
  document = ingresarRetiroACajaMayorMutation;
}
