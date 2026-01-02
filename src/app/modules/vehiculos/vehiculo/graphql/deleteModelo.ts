import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';
import { deleteModeloMutation } from './aux-graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeleteModeloGQL extends Mutation<Response> {
  override document = deleteModeloMutation;
}

