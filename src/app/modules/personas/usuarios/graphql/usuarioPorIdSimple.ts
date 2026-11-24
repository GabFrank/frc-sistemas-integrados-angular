import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Usuario } from '../usuario.model';
import { usuarioSimpleQuery } from './graphql-query';

export interface Response {
  data: Usuario;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioPorIdSimpleGQL extends Query<Response> {
  document = usuarioSimpleQuery;
}
