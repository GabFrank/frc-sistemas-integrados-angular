import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { testOpenAiConnectionMutation } from './graphql-query';

export interface Response {
  data: { testOpenAiConnection: string };
}

@Injectable({ providedIn: 'root' })
export class TestOpenAiConnectionGQL extends Mutation<Response> {
  document = testOpenAiConnectionMutation;
}
