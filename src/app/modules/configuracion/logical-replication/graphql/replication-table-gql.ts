import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { REPLICATION_TABLE_QUERY } from './graphql-query';
import { ReplicationTable } from '../replication-table.model';

export interface ReplicationTableResponse {
  data: ReplicationTable;
}

export interface ReplicationTableVariables {
  id: string | number;
}

@Injectable({
  providedIn: 'root'
})
export class ReplicationTableGQL extends Query<ReplicationTableResponse, ReplicationTableVariables> {
  document = REPLICATION_TABLE_QUERY;
} 