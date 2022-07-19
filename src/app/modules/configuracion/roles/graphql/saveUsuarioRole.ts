import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Role, UsuarioRole } from '../role.model';
import { saveRole, saveUsuarioRole } from './graphql-query';

export interface Response {
  data: UsuarioRole;
}

@Injectable({
  providedIn: 'root',
})
export class SaveUsuarioRoleGQL extends Mutation<Response> {
  document = saveUsuarioRole;
}
