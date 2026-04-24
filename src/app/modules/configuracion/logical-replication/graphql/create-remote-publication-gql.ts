import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { CREATE_REMOTE_PUBLICATION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface CreateRemotePublicationResponse {
  data: ReplicationStatus;
}

export interface CreateRemotePublicationVariables {
  branchSucursalId: string | number;
  publicationName: string;
  tables: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CreateRemotePublicationGQL extends Mutation<CreateRemotePublicationResponse, CreateRemotePublicationVariables> {
  document = CREATE_REMOTE_PUBLICATION_MUTATION;
} 