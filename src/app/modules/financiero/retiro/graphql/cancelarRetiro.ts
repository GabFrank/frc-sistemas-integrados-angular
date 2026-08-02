import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cancelarRetiroQuery } from './graphql-query';

class Response {
  data: boolean
}

@Injectable({
  providedIn: 'root',
})
export class CancelarRetiroGQL extends Mutation<Response> {
  document = cancelarRetiroQuery;
}
