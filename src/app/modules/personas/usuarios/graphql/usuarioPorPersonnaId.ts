import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Usuario } from '../usuario.model';
import { usuarioPorPersonaIdQuery, usuarioQuery } from './graphql-query';

export interface Response {
  data: Usuario;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioPorPersonaIdGQL extends Query<Response> {
  document = usuarioPorPersonaIdQuery;
}
