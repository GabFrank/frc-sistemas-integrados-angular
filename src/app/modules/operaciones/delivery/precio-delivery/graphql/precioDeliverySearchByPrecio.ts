import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PrecioDelivery } from '../../precio-delivery.model';
import { preciosDeliveryQuery } from './graphql-query';

export interface Response {
  data: PrecioDelivery[];
}

@Injectable({
  providedIn: 'root',
})
export class PreciosDeliveryGQL extends Query<Response> {
  document = preciosDeliveryQuery;
}
