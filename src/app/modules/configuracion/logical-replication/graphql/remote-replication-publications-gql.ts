import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { REMOTE_REPLICATION_PUBLICATIONS_QUERY } from './graphql-query';
import { PageInfo } from '../../../../app.component';
import { LogicalReplication } from '../logical-replication.model';

export interface RemoteReplicationPublicationsResponse {
  data: PageInfo<LogicalReplication>;
}

export interface RemoteReplicationPublicationsVariables {
  sucursalId: string | number;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RemoteReplicationPublicationsGQL extends Query<RemoteReplicationPublicationsResponse, RemoteReplicationPublicationsVariables> {
  document = REMOTE_REPLICATION_PUBLICATIONS_QUERY;
} 