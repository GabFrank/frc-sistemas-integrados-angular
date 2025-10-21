import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { REFRESH_ALL_SUBSCRIPTIONS_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface RefreshAllSubscriptionsResponse {
  refreshAllSubscriptions: ReplicationStatus;
}

@Injectable({
  providedIn: 'root'
})
export class RefreshAllSubscriptionsGQL extends Mutation<RefreshAllSubscriptionsResponse, {}> {
  document = REFRESH_ALL_SUBSCRIPTIONS_MUTATION;
}




