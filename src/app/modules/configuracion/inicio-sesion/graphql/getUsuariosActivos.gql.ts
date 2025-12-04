import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { getUsuariosActivosQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetUsuariosActivosGQL extends Query {
  document = getUsuariosActivosQuery;
}

