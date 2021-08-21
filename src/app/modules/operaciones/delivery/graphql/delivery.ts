import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Delivery } from '../delivery.model';
import { deliverysQuery } from './graphql-query';

export interface Response {
  data: Delivery[];
}

@Injectable({
  providedIn: 'root',
})
export class DeliverysGetAllGQL extends Query<Response> {
  document = deliverysQuery;
}
