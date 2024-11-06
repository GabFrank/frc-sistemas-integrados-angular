import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { resumenFacturasQuery } from './graphql-query';

export interface Response {
  data: ResumenFacturasGQL;
}

@Injectable({
  providedIn: 'root',
})
export class ResumenFacturasGQL extends Query<Response> {
  document = resumenFacturasQuery;
}
