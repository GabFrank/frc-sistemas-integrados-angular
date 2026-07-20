import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Impresora } from '../impresora.model';
import { impresoraQuery } from './graphql-query';

export interface Response {
  data: Impresora;
}

@Injectable({
  providedIn: 'root',
})
export class ImpresoraByIdGQL extends Query<Response> {
  document = impresoraQuery;
}
