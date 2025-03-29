import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { REPLICATION_SUBSCRIPTIONS_QUERY } from './graphql-query';
import { PageInfo } from '../../../../app.component';
import { LogicalReplication } from '../logical-replication.model';

export interface ReplicationSubscriptionsResponse {
  replicationSubscriptions: PageInfo<LogicalReplication>;
}

@Injectable({
  providedIn: 'root'
})
export class ReplicationSubscriptionsGQL extends Query<ReplicationSubscriptionsResponse> {
  document = REPLICATION_SUBSCRIPTIONS_QUERY;
} 