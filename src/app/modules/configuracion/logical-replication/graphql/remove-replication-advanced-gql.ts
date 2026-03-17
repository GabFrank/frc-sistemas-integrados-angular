import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { REMOVE_REPLICATION_ADVANCED_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface RemoveReplicationAdvancedResponse {
  data: ReplicationStatus;
}

export interface RemoveReplicationAdvancedVariables {
  sucursalId: string;
  target: string;
  scope: string;
}

@Injectable({
  providedIn: 'root'
})
export class RemoveReplicationAdvancedGQL extends Mutation<RemoveReplicationAdvancedResponse, RemoveReplicationAdvancedVariables> {
  document = REMOVE_REPLICATION_ADVANCED_MUTATION;
}
