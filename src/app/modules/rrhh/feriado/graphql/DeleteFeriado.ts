import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteFeriadoMutation } from './graphql-query';

export interface Response {
  deleteFeriado: boolean;
}

@Injectable({ providedIn: 'root' })
export class DeleteFeriadoGQL extends Mutation<Response> {
  document = deleteFeriadoMutation;
}
