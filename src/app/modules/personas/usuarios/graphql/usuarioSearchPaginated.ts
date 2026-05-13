import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Usuario } from '../usuario.model';
import { usuariosSearchPaginated } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class UsuariosSearchPaginatedGQL extends Query<Usuario[]> {
  document = usuariosSearchPaginated;
}
