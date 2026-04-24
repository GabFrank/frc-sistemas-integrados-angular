import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { REFRESH_REMOTE_SUBSCRIPTION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface RefreshRemoteSubscriptionResponse {
  refreshRemoteSubscription: ReplicationStatus;
}

export interface RefreshRemoteSubscriptionVariables {
  branchSucursalId: number | string;
  subscriptionName: string;
}

@Injectable({
  providedIn: 'root'
})
export class RefreshRemoteSubscriptionGQL extends Mutation<RefreshRemoteSubscriptionResponse, RefreshRemoteSubscriptionVariables> {
  document = REFRESH_REMOTE_SUBSCRIPTION_MUTATION;
}




