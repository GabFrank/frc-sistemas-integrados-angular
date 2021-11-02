import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Usuario } from '../usuario.model';
import { usuarioQuery, usuariosSearch } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class UsuarioSearchGQL extends Query<Usuario[]> {
  document = usuariosSearch;
}
