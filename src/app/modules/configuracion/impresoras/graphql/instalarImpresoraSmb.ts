import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { instalarImpresoraSmbMutation } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class InstalarImpresoraSmbGQL extends Mutation<Response> {
  document = instalarImpresoraSmbMutation;
}
