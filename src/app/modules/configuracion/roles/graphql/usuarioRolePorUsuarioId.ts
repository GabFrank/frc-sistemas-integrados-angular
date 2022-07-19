import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Role, UsuarioRole } from '../role.model';
import { roleQuery, usuarioRolePorUsuarioIdQuery } from './graphql-query';

export interface Response {
  data: UsuarioRole[];
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioRolePorUsuarioIdGQL extends Query<Response> {
  document = usuarioRolePorUsuarioIdQuery;
}
