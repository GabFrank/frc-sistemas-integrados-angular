import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { REFRESH_ALL_REMOTE_SUBSCRIPTIONS_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface RefreshAllRemoteSubscriptionsResponse {
  refreshAllRemoteSubscriptions: ReplicationStatus;
}

export interface RefreshAllRemoteSubscriptionsVariables {
  branchSucursalId: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class RefreshAllRemoteSubscriptionsGQL extends Mutation<RefreshAllRemoteSubscriptionsResponse, RefreshAllRemoteSubscriptionsVariables> {
  document = REFRESH_ALL_REMOTE_SUBSCRIPTIONS_MUTATION;
}



