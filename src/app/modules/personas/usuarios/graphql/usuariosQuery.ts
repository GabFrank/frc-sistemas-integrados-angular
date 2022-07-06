import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Usuario } from '../usuario.model';
import { usuariosQuery } from './graphql-query';

export interface Response {
  data: Usuario[];
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosGQL extends Query<Response> {
  document = usuariosQuery;
}
