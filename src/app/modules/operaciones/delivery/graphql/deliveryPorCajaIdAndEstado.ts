import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Delivery } from '../delivery.model';
import { deliveryPorCajaIdAndEstadoQuery } from './graphql-query';

export interface Response {
  data: Delivery[];
}

@Injectable({
  providedIn: 'root',
})
export class DeliverysPorCajaIdAndEstadoGQL extends Query<Response> {
  document = deliveryPorCajaIdAndEstadoQuery;
}
