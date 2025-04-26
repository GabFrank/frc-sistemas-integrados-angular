import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { TOGGLE_REPLICATION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface ToggleReplicationResponse {
  toggleReplication: ReplicationStatus;
}

export interface ToggleReplicationVariables {
  sucursalId: number | string;
  enabled: boolean;
  isSubscription: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToggleReplicationGQL extends Mutation<ToggleReplicationResponse, ToggleReplicationVariables> {
  document = TOGGLE_REPLICATION_MUTATION;
} 