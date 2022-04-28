import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cancelarVentaQuery } from './graphql-query';

class Response {
  data: boolean
}

@Injectable({
  providedIn: 'root',
})
export class CancelarVentaGQL extends Mutation<Response> {
  document = cancelarVentaQuery;
}
