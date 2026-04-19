import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { GET_REPLICATION_SETUP_STATE_QUERY } from './graphql-query';

export interface ReplicationSetupState {
  centralPublicationExists: boolean;
  centralSubscriptionExists: boolean;
  filialReachable: boolean;
  filialPublicationExists: boolean;
  filialSubscriptionBidiExists: boolean;
  filialSubscriptionCentralExists: boolean;
}

export interface GetReplicationSetupStateResponse {
  data: ReplicationSetupState;
}

export interface GetReplicationSetupStateVariables {
  sucursalId: string;
}

@Injectable({
  providedIn: 'root'
})
export class GetReplicationSetupStateGQL extends Query<GetReplicationSetupStateResponse, GetReplicationSetupStateVariables> {
  document = GET_REPLICATION_SETUP_STATE_QUERY;
}
