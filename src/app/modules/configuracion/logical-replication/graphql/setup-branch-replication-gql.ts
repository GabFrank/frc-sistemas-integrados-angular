import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SETUP_BRANCH_REPLICATION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface SetupBranchReplicationResponse {
  setupBranchReplication: ReplicationStatus;
}

@Injectable({
  providedIn: 'root'
})
export class SetupBranchReplicationGQL extends Mutation<SetupBranchReplicationResponse> {
  document = SETUP_BRANCH_REPLICATION_MUTATION;
} 