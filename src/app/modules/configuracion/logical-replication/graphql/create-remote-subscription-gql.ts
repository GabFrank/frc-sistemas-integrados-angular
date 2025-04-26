import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { CREATE_REMOTE_SUBSCRIPTION_MUTATION } from './graphql-query';
import { ReplicationStatus } from '../logical-replication.model';

export interface CreateRemoteSubscriptionResponse {
  data: ReplicationStatus;
}

export interface CreateRemoteSubscriptionVariables {
  branchSucursalId: string | number;
  subscriptionName: string;
  connectionString: string;
  publicationName: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreateRemoteSubscriptionGQL extends Mutation<CreateRemoteSubscriptionResponse, CreateRemoteSubscriptionVariables> {
  document = CREATE_REMOTE_SUBSCRIPTION_MUTATION;
} 