import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveBancoMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class SaveBancoGQL extends Mutation<Response> {
  document = saveBancoMutation;
}
