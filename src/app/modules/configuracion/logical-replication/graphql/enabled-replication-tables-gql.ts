import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ENABLED_REPLICATION_TABLES_QUERY } from './graphql-query';
import { ReplicationTable } from '../replication-table.model';

export interface EnabledReplicationTablesResponse {
  data: ReplicationTable[];
}

@Injectable({
  providedIn: 'root'
})
export class EnabledReplicationTablesGQL extends Query<EnabledReplicationTablesResponse> {
  document = ENABLED_REPLICATION_TABLES_QUERY;
} 