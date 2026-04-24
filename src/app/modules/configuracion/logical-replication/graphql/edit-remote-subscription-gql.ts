import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { EDIT_REMOTE_SUBSCRIPTION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface EditRemoteSubscriptionResponse {
  data: ReplicationStatus;
}

export interface EditRemoteSubscriptionVariables {
  branchSucursalId: string | number;
  subscriptionName: string;
  connectionString?: string;
  publicationName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EditRemoteSubscriptionGQL extends Mutation<EditRemoteSubscriptionResponse, EditRemoteSubscriptionVariables> {
  document = EDIT_REMOTE_SUBSCRIPTION_MUTATION;
} 