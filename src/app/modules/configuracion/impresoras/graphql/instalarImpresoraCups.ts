import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { instalarImpresoraCupsMutation } from './graphql-query';

export interface Response {
  instalarImpresoraCups: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class InstalarImpresoraCupsGQL extends Mutation<Response> {
  document = instalarImpresoraCupsMutation;
}
