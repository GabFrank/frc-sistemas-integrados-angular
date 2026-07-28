import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { impresorasDelSistemaQuery } from './graphql-query';

export interface Response {
  data: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ImpresorasDelSistemaGQL extends Query<Response> {
  document = impresorasDelSistemaQuery;
}
