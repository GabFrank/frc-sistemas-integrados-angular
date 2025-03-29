import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { SEARCH_REMOTE_REPLICATION_SUBSCRIPTIONS_QUERY } from './graphql-query';
import { PageInfo } from '../../../../app.component';
import { LogicalReplication } from '../logical-replication.model';

export interface SearchRemoteReplicationSubscriptionsResponse {
  data: PageInfo<LogicalReplication>;
}

export interface SearchRemoteReplicationSubscriptionsVariables {
  sucursalId: string | number;
  query?: string;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchRemoteReplicationSubscriptionsGQL extends Query<SearchRemoteReplicationSubscriptionsResponse, SearchRemoteReplicationSubscriptionsVariables> {
  document = SEARCH_REMOTE_REPLICATION_SUBSCRIPTIONS_QUERY;
} 