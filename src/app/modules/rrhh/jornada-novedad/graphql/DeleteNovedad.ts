import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteNovedadMutation } from './graphql-query';

export interface Response {
  deleteJornadaNovedad: boolean;
}

@Injectable({ providedIn: 'root' })
export class DeleteNovedadGQL extends Mutation<Response> {
  document = deleteNovedadMutation;
}
