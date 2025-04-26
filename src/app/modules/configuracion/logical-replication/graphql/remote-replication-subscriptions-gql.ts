import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { REMOTE_REPLICATION_SUBSCRIPTIONS_QUERY } from './graphql-query';
import { PageInfo } from '../../../../app.component';
import { LogicalReplication } from '../logical-replication.model';

export interface RemoteReplicationSubscriptionsResponse {
  data: PageInfo<LogicalReplication>;
}

export interface RemoteReplicationSubscriptionsVariables {
  sucursalId: string | number;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RemoteReplicationSubscriptionsGQL extends Query<RemoteReplicationSubscriptionsResponse, RemoteReplicationSubscriptionsVariables> {
  document = REMOTE_REPLICATION_SUBSCRIPTIONS_QUERY;
} 