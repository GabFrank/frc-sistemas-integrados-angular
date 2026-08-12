import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteMonedaQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class DeleteMonedaGQL extends Mutation<Response> {
  document = deleteMonedaQuery;
}
