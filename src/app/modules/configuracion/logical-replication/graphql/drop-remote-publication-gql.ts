import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { DROP_REMOTE_PUBLICATION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface DropRemotePublicationResponse {
  data: ReplicationStatus;
}

export interface DropRemotePublicationVariables {
  branchSucursalId: string | number;
  publicationName: string;
}

@Injectable({
  providedIn: 'root'
})
export class DropRemotePublicationGQL extends Mutation<DropRemotePublicationResponse, DropRemotePublicationVariables> {
  document = DROP_REMOTE_PUBLICATION_MUTATION;
} 