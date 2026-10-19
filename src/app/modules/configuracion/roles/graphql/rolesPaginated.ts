import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Role } from '../role.model';
import { rolesPaginatedQuery } from './graphql-query';

export interface Response {
  data: PageInfo<Role>;
}

@Injectable({
  providedIn: 'root',
})
export class RolesPaginatedGQL extends Query<Response> {
  document = rolesPaginatedQuery;
}
