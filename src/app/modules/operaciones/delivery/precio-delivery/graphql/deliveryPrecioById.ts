import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PrecioDelivery } from '../../precio-delivery.model';
import { DeliveryPrecio } from '../delivery-precios.model';
import { precioDeliveryQuery } from './graphql-query';

export interface Response {
  data: PrecioDelivery;
}

@Injectable({
  providedIn: 'root',
})
export class DeliveryPrecioByIdGQL extends Query<Response> {
  document = precioDeliveryQuery;
}
