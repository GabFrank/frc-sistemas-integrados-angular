import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { usuariosActivosQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class UsuariosActivosGQL extends Query {
  document = usuariosActivosQuery;
}

