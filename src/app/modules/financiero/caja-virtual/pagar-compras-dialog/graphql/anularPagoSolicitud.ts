import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { anularPagoCppMutation } from './graphql-query';
export interface Response { data: any; }
@Injectable({ providedIn: 'root' })
export class AnularPagoCppGQL extends Mutation<Response> {
  document = anularPagoCppMutation;
}
