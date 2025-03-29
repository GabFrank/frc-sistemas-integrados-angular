import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { GENERATE_CONNECTION_STRING_QUERY } from './graphql-query';

export interface GenerateConnectionStringResponse {
  data: string;
}

export interface GenerateConnectionStringVariables {
  host: string;
  port: number;
  dbName: string;
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class GenerateConnectionStringGQL extends Query<GenerateConnectionStringResponse, GenerateConnectionStringVariables> {
  document = GENERATE_CONNECTION_STRING_QUERY;
} 