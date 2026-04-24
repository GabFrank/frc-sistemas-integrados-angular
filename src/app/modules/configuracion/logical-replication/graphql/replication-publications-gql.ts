import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { REPLICATION_PUBLICATIONS_QUERY } from './graphql-query';
import { PageInfo } from '../../../../app.component';
import { LogicalReplication } from '../logical-replication.model';

export interface ReplicationPublicationsResponse {
  replicationPublications: PageInfo<LogicalReplication>;
}

@Injectable({
  providedIn: 'root'
})
export class ReplicationPublicationsGQL extends Query<ReplicationPublicationsResponse> {
  document = REPLICATION_PUBLICATIONS_QUERY;
} 