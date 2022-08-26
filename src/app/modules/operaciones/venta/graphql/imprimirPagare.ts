import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { imprimirPagareQuery } from './graphql-query';

class Response {
  data: boolean
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirPagareGQL extends Mutation<Response> {
  document = imprimirPagareQuery;
}
