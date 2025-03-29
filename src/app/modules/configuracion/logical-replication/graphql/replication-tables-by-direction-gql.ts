import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { REPLICATION_TABLES_BY_DIRECTION_QUERY } from './graphql-query';
import { ReplicationDirection, ReplicationTable } from '../replication-table.model';

export interface ReplicationTablesByDirectionResponse {
  data: ReplicationTable[];
}

export interface ReplicationTablesByDirectionVariables {
  direction: ReplicationDirection;
}

@Injectable({
  providedIn: 'root'
})
export class ReplicationTablesByDirectionGQL extends Query<ReplicationTablesByDirectionResponse, ReplicationTablesByDirectionVariables> {
  document = REPLICATION_TABLES_BY_DIRECTION_QUERY;
} 