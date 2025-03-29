import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { REMOVE_REPLICATION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface RemoveReplicationResponse {
  removeReplication: ReplicationStatus;
}

@Injectable({
  providedIn: 'root'
})
export class RemoveReplicationGQL extends Mutation<RemoveReplicationResponse> {
  document = REMOVE_REPLICATION_MUTATION;
} 