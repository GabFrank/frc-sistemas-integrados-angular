import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SETUP_REPLICATION_ADVANCED_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface SetupReplicationAdvancedResponse {
  data: ReplicationStatus;
}

export interface SetupReplicationAdvancedVariables {
  sucursalId: string;
  target: string;
  scope: string;
}

@Injectable({
  providedIn: 'root'
})
export class SetupReplicationAdvancedGQL extends Mutation<SetupReplicationAdvancedResponse, SetupReplicationAdvancedVariables> {
  document = SETUP_REPLICATION_ADVANCED_MUTATION;
}
