import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Delivery } from '../delivery.model';
import { saveDeliveryEstadoQuery } from './graphql-query';

export interface Response {
  data: Delivery;
}
@Injectable({
  providedIn: 'root',
})
export class SaveDeliveryEstadoGQL extends Mutation<Response> {
  document = saveDeliveryEstadoQuery;
}
