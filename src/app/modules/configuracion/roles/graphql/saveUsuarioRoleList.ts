import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { UsuarioRole } from '../role.model';
import { saveUsuarioRoleList } from './graphql-query';

export interface Response {
  data: UsuarioRole[];
}

@Injectable({
  providedIn: 'root',
})
export class SaveUsuarioRoleListGQL extends Mutation<Response> {
  document = saveUsuarioRoleList;
}
