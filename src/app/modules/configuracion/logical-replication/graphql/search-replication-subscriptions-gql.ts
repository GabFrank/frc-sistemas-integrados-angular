import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { SEARCH_REPLICATION_SUBSCRIPTIONS_QUERY } from './graphql-query';
import { PageInfo } from '../../../../app.component';
import { LogicalReplication } from '../logical-replication.model';

export interface SearchReplicationSubscriptionsResponse {
  data: PageInfo<LogicalReplication>;
}

export interface SearchReplicationSubscriptionsVariables {
  query?: string;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchReplicationSubscriptionsGQL extends Query<SearchReplicationSubscriptionsResponse, SearchReplicationSubscriptionsVariables> {
  document = SEARCH_REPLICATION_SUBSCRIPTIONS_QUERY;
} 