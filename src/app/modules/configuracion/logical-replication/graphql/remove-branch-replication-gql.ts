import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { REMOVE_BRANCH_REPLICATION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface RemoveBranchReplicationResponse {
  removeBranchReplication: ReplicationStatus;
}

@Injectable({
  providedIn: 'root'
})
export class RemoveBranchReplicationGQL extends Mutation<RemoveBranchReplicationResponse> {
  document = REMOVE_BRANCH_REPLICATION_MUTATION;
} 