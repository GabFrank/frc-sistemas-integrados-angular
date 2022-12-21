import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Delivery } from '../delivery.model';
import { deliverysByEstadoList } from './graphql-query';

export interface Response {
  data: Delivery[];
}

@Injectable({
  providedIn: 'root',
})
export class DeliverysByEstadoListGQL extends Query<Response> {
  document = deliverysByEstadoList;
}
