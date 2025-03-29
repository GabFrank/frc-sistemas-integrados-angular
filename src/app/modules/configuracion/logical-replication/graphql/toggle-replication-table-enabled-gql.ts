import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { TOGGLE_REPLICATION_TABLE_ENABLED_MUTATION } from './graphql-query';

export interface ToggleReplicationTableEnabledResponse {
  data: boolean;
}

export interface ToggleReplicationTableEnabledVariables {
  id: string | number;
}

@Injectable({
  providedIn: 'root'
})
export class ToggleReplicationTableEnabledGQL extends Mutation<ToggleReplicationTableEnabledResponse, ToggleReplicationTableEnabledVariables> {
  document = TOGGLE_REPLICATION_TABLE_ENABLED_MUTATION;
} 