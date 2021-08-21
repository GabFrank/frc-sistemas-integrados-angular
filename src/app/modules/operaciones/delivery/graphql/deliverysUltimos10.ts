import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Delivery } from '../delivery.model';
import { DeliveryEstado } from '../enums';
import { deliverysByEstado, deliverysQuery, deliverysUltimos10Query } from './graphql-query';

export interface Response {
  data: Delivery[];
}

@Injectable({
  providedIn: 'root',
})
export class DeliverysUltimos10GQL extends Query<Response> {
  document = deliverysUltimos10Query;
}
