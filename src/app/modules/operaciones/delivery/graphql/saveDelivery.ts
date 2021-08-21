import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Delivery } from '../delivery.model';
import { deliverysQuery, saveDelivery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveDeliveryGQL extends Mutation<Delivery> {
  document = saveDelivery;
}
