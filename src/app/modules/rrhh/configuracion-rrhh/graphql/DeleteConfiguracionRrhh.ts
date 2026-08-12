import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteConfiguracionRrhhMutation } from './graphql-query';

export interface Response {
  deleteConfiguracionRrhh: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteConfiguracionRrhhGQL extends Mutation<Response> {
  document = deleteConfiguracionRrhhMutation;
}
