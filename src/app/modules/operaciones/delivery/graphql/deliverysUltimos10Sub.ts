import { Injectable } from '@angular/core';
import { Query, Subscription } from 'apollo-angular';
import { Delivery } from '../delivery.model';
import { DeliveryEstado } from '../enums';
import { deliverysByEstado, deliverysQuery, deliverysSubsUltimos10Query, deliverysUltimos10Query } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeliverysUltimos10SubGQL extends Subscription<Delivery>{
  document = deliverysSubsUltimos10Query;
}
