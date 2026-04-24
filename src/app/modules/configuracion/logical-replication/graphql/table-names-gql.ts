import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { 
  MAIN_TO_ALL_TABLE_NAMES_QUERY,
  MAIN_TO_SPECIFIC_TABLE_NAMES_QUERY,
  BRANCH_TO_MAIN_TABLE_NAMES_QUERY
} from './graphql-query';

export interface TableNamesResponse {
  data: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MainToAllTableNamesGQL extends Query<TableNamesResponse> {
  document = MAIN_TO_ALL_TABLE_NAMES_QUERY;
}

@Injectable({
  providedIn: 'root'
})
export class MainToSpecificTableNamesGQL extends Query<TableNamesResponse> {
  document = MAIN_TO_SPECIFIC_TABLE_NAMES_QUERY;
}

@Injectable({
  providedIn: 'root'
})
export class BranchToMainTableNamesGQL extends Query<TableNamesResponse> {
  document = BRANCH_TO_MAIN_TABLE_NAMES_QUERY;
} 