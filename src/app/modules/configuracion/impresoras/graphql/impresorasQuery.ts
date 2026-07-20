import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Impresora } from '../impresora.model';
import { impresorasQuery } from './graphql-query';

export interface Response {
  data: Impresora[];
}

@Injectable({
  providedIn: 'root',
})
export class ImpresorasGQL extends Query<Response> {
  document = impresorasQuery;
}
