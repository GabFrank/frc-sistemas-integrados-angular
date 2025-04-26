import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SAVE_REPLICATION_TABLE_MUTATION } from './graphql-query';
import { ReplicationDirection, ReplicationTable } from '../replication-table.model';

export interface SaveReplicationTableResponse {
  data: ReplicationTable;
}

export interface SaveReplicationTableVariables {
  input: {
    id?: number;
    tableName: string;
    direction: ReplicationDirection;
    enabled?: boolean;
    description?: string;
    usuarioId?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SaveReplicationTableGQL extends Mutation<SaveReplicationTableResponse, SaveReplicationTableVariables> {
  document = SAVE_REPLICATION_TABLE_MUTATION;
} 