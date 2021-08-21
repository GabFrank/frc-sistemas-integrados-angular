import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Delivery } from '../delivery.model';
import { DeliveryEstado } from '../enums';
import { deliverysByEstado, deliverysQuery } from './graphql-query';

export interface Response {
  data: Delivery[];
}

@Injectable({
  providedIn: 'root',
})
export class DeliverysByEstadoGQL extends Query<Response> {
  document = deliverysByEstado;
}
