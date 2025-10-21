import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { REFRESH_SUBSCRIPTION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface RefreshSubscriptionResponse {
  refreshSubscription: ReplicationStatus;
}

export interface RefreshSubscriptionVariables {
  subscriptionName: string;
}

@Injectable({
  providedIn: 'root'
})
export class RefreshSubscriptionGQL extends Mutation<RefreshSubscriptionResponse, RefreshSubscriptionVariables> {
  document = REFRESH_SUBSCRIPTION_MUTATION;
}




