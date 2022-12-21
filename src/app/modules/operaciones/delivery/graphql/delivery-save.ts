import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Delivery } from '../delivery.model';
import { saveDeliveryAndVentaQuery } from './graphql-query';

export interface Response {
  data: Delivery;
}

@Injectable({
  providedIn: 'root',
})
export class SaveDeliveryAndVentaGQL extends Query<Response> {
  document = saveDeliveryAndVentaQuery;
}
