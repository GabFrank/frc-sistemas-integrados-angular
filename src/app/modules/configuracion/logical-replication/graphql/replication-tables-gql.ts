import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { REPLICATION_TABLES_QUERY } from './graphql-query';
import { ReplicationTable } from '../replication-table.model';

export interface ReplicationTablesResponse {
  data: ReplicationTable[];
}

@Injectable({
  providedIn: 'root'
})
export class ReplicationTablesGQL extends Query<ReplicationTablesResponse> {
  document = REPLICATION_TABLES_QUERY;
} 