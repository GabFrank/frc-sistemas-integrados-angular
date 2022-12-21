import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { reimprimirDeliveryQuery } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ReimprimirDeliveryGQL extends Query<Response> {
  document = reimprimirDeliveryQuery;
}
