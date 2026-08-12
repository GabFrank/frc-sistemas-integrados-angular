import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteTipoJustificativoMutation } from './graphql-query';

export interface Response {
  deleteTipoJustificativo: boolean;
}

@Injectable({ providedIn: 'root' })
export class DeleteTipoJustificativoGQL extends Mutation<Response> {
  document = deleteTipoJustificativoMutation;
}
