import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteEquipoMutation } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteEquipoGQL extends Mutation<Response> {
  override document = deleteEquipoMutation;
}
