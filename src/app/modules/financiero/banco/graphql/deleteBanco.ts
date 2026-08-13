import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteBancoMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class DeleteBancoGQL extends Mutation<Response> {
  document = deleteBancoMutation;
}
