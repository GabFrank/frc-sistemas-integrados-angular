import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { 
  GENERATE_BRANCH_PUBLICATION_NAME_QUERY,
  GENERATE_BRANCH_SUBSCRIPTION_NAME_QUERY,
  GENERATE_CENTRAL_TO_BRANCH_PUBLICATION_NAME_QUERY,
  GENERATE_CENTRAL_TO_BRANCH_SUBSCRIPTION_NAME_QUERY
} from './graphql-query';

export interface GenerateNameResponse {
  data: string;
}

export interface GenerateNameVariables {
  sucursalId: string | number;
}

@Injectable({
  providedIn: 'root'
})
export class GenerateBranchPublicationNameGQL extends Query<GenerateNameResponse, GenerateNameVariables> {
  document = GENERATE_BRANCH_PUBLICATION_NAME_QUERY;
}

@Injectable({
  providedIn: 'root'
})
export class GenerateBranchSubscriptionNameGQL extends Query<GenerateNameResponse, GenerateNameVariables> {
  document = GENERATE_BRANCH_SUBSCRIPTION_NAME_QUERY;
}

@Injectable({
  providedIn: 'root'
})
export class GenerateCentralToBranchPublicationNameGQL extends Query<GenerateNameResponse, GenerateNameVariables> {
  document = GENERATE_CENTRAL_TO_BRANCH_PUBLICATION_NAME_QUERY;
}

@Injectable({
  providedIn: 'root'
})
export class GenerateCentralToBranchSubscriptionNameGQL extends Query<GenerateNameResponse, GenerateNameVariables> {
  document = GENERATE_CENTRAL_TO_BRANCH_SUBSCRIPTION_NAME_QUERY;
} 