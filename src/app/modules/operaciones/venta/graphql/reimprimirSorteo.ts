import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { reimprimirSorteoQuery } from './graphql-query';

class Response {
  data: boolean
}

@Injectable({
  providedIn: 'root',
})
export class ReimprimirSorteoGQL extends Mutation<Response> {
  document = reimprimirSorteoQuery;
}
