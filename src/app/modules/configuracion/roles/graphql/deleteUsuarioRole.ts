import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Role } from '../role.model';
import { deleteRoleQuery, deleteUsuarioRoleQuery, saveRole } from './graphql-query';

export interface Response {
  data: Role;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteUsuarioRoleGQL extends Mutation<boolean> {
  document = deleteUsuarioRoleQuery;
}
