import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Delivery } from '../delivery.model';
import { deliveryQuery } from './graphql-query';

export interface Response {
  data: Delivery;
}

@Injectable({
  providedIn: 'root',
})
export class DeliveryByIdGQL extends Query<Response> {
  document = deliveryQuery;
}
