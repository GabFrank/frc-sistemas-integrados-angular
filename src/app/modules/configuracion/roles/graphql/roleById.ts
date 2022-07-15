import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Role } from '../role.model';
import { roleQuery } from './graphql-query';

export interface Response {
  role: Role;
}

@Injectable({
  providedIn: 'root',
})
export class RoleByIdGQL extends Query<Response> {
  document = roleQuery;
}
