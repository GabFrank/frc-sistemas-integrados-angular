import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { GENERATE_CENTRAL_CONNECTION_STRING_QUERY } from './graphql-query';

export interface GenerateCentralConnectionStringResponse {
  data: string;
}

@Injectable({
  providedIn: 'root'
})
export class GenerateCentralConnectionStringGQL extends Query<GenerateCentralConnectionStringResponse, {}> {
  document = GENERATE_CENTRAL_CONNECTION_STRING_QUERY;
} 