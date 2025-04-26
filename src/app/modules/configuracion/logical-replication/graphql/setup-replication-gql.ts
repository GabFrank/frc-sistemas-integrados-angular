import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SETUP_REPLICATION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface SetupReplicationResponse {
  setupReplication: ReplicationStatus;
}

@Injectable({
  providedIn: 'root'
})
export class SetupReplicationGQL extends Mutation<SetupReplicationResponse> {
  document = SETUP_REPLICATION_MUTATION;
} 