import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { reactivarColaMutation } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ReactivarColaGQL extends Mutation<Response> {
  document = reactivarColaMutation;
}
