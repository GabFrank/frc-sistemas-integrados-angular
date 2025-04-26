import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { TOGGLE_REMOTE_SUBSCRIPTION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface ToggleRemoteSubscriptionResponse {
  data: ReplicationStatus;
}

export interface ToggleRemoteSubscriptionVariables {
  branchSucursalId: string | number;
  subscriptionName: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToggleRemoteSubscriptionGQL extends Mutation<ToggleRemoteSubscriptionResponse, ToggleRemoteSubscriptionVariables> {
  document = TOGGLE_REMOTE_SUBSCRIPTION_MUTATION;
} 