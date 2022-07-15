import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Role } from '../role.model';
import { deleteRoleQuery, saveRole } from './graphql-query';

export interface Response {
  role: Role;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteRoleGQL extends Mutation<boolean> {
  document = deleteRoleQuery;
}
