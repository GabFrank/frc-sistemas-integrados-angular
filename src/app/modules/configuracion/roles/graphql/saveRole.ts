import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Role } from '../role.model';
import { saveRole } from './graphql-query';

export interface Response {
  data: Role;
}

@Injectable({
  providedIn: 'root',
})
export class SaveRoleGQL extends Mutation<Response> {
  document = saveRole;
}
