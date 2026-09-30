import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Usuario } from '../usuario.model';
import { usuariosSearchPaginatedPorRoles } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class UsuariosSearchPaginatedPorRolesGQL extends Query<Usuario[]> {
  document = usuariosSearchPaginatedPorRoles;
}
