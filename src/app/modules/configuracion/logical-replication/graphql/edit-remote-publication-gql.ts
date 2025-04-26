import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { EDIT_REMOTE_PUBLICATION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface EditRemotePublicationResponse {
  data: ReplicationStatus;
}

export interface EditRemotePublicationVariables {
  branchSucursalId: string | number;
  publicationName: string;
  tables: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EditRemotePublicationGQL extends Mutation<EditRemotePublicationResponse, EditRemotePublicationVariables> {
  document = EDIT_REMOTE_PUBLICATION_MUTATION;
} 