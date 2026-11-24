import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Usuario } from '../usuario.model';
import { usuariosSearchPaginatedConFiltros } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class UsuariosSearchPaginatedConFiltrosGQL extends Query<Usuario[]> {
  document = usuariosSearchPaginatedConFiltros;
}
