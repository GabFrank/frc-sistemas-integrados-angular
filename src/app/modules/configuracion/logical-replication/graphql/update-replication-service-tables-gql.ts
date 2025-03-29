import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { UPDATE_REPLICATION_SERVICE_TABLES_MUTATION } from './graphql-query';

export interface UpdateReplicationServiceTablesResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UpdateReplicationServiceTablesGQL extends Mutation<UpdateReplicationServiceTablesResponse> {
  document = UPDATE_REPLICATION_SERVICE_TABLES_MUTATION;
} 