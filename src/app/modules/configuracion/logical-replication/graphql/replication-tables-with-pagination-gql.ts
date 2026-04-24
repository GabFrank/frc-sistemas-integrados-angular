import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { REPLICATION_TABLES_WITH_PAGINATION_QUERY } from './graphql-query';
import { PageInfo } from '../../../../app.component';
import { ReplicationTable } from '../replication-table.model';

export interface ReplicationTablesWithPaginationResponse {
  data: PageInfo<ReplicationTable>;
}

export interface ReplicationTablesWithPaginationVariables {
  page?: number;
  size?: number;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReplicationTablesWithPaginationGQL extends Query<ReplicationTablesWithPaginationResponse, ReplicationTablesWithPaginationVariables> {
  document = REPLICATION_TABLES_WITH_PAGINATION_QUERY;
} 