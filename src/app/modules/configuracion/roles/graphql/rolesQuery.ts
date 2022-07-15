import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Role } from '../role.model';
import { roleQuery, rolesQuery } from './graphql-query';

export interface Response {
  role: Role[];
}

@Injectable({
  providedIn: 'root',
})
export class RolesGQL extends Query<Response> {
  document = rolesQuery;
}
