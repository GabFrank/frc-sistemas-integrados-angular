import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { DELETE_REPLICATION_TABLE_MUTATION } from './graphql-query';

export interface DeleteReplicationTableResponse {
  data: boolean;
}

export interface DeleteReplicationTableVariables {
  id: string | number;
}

@Injectable({
  providedIn: 'root'
})
export class DeleteReplicationTableGQL extends Mutation<DeleteReplicationTableResponse, DeleteReplicationTableVariables> {
  document = DELETE_REPLICATION_TABLE_MUTATION;
} 