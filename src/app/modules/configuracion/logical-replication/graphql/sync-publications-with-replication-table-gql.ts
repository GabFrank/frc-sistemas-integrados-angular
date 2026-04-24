import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SYNC_PUBLICATIONS_WITH_REPLICATION_TABLE_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface SyncPublicationsWithReplicationTableResponse {
  syncPublicationsWithReplicationTable: ReplicationStatus;
}

@Injectable({
  providedIn: 'root'
})
export class SyncPublicationsWithReplicationTableGQL extends Mutation<SyncPublicationsWithReplicationTableResponse, {}> {
  document = SYNC_PUBLICATIONS_WITH_REPLICATION_TABLE_MUTATION;
}
