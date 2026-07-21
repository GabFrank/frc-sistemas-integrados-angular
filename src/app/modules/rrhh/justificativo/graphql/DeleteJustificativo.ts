import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteJustificativoMutation } from './graphql-query';

export interface Response {
  deleteJustificativo: boolean;
}

@Injectable({ providedIn: 'root' })
export class DeleteJustificativoGQL extends Mutation<Response> {
  document = deleteJustificativoMutation;
}
