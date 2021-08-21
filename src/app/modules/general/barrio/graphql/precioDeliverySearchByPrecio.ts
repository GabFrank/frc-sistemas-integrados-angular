import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PrecioDelivery } from '../../../../modules/operaciones/delivery/precio-delivery.model';
import { precioDeliveryQuery } from '../../../../modules/operaciones/delivery/precio-delivery/graphql/graphql-query';

export interface Response {
  deliveryPrecios: PrecioDelivery[];
}

@Injectable({
  providedIn: 'root',
})
export class DeliveryPreciosGQL extends Query<Response> {
  document = precioDeliveryQuery;
}
