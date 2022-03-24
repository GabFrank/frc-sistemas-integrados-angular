import { Injectable } from '@angular/core';
import { Subscription } from 'apollo-angular';
import { Delivery } from '../delivery.model';
import { deliverysSubsUltimos10Query } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeliverysUltimos10SubGQL extends Subscription<Delivery>{
  document = deliverysSubsUltimos10Query;
}
