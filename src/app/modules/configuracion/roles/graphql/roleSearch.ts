import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Role } from '../role.model';
import { rolesSearch } from './graphql-query';

export interface Response {
  data: Role[];
}

@Injectable({
  providedIn: 'root',
})
export class RolesSearchGQL extends Query<Response> {
  document = rolesSearch;
}
