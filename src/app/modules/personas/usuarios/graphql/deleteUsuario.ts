import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Usuario } from '../usuario.model';
import { deleteUsuarioQuery, saveUsuario, usuarioQuery } from './graphql-query';

export interface Response {
  data: Usuario;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteUsuarioGQL extends Mutation<boolean> {
  document = deleteUsuarioQuery;
}
