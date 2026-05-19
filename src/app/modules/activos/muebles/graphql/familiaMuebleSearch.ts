import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FamiliaMueble } from '../models/familia-mueble.model';
import { familiaMuebleSearchQuery } from './graphql-query';

export interface Response {
  data: FamiliaMueble[];
}

@Injectable({
  providedIn: 'root',
})
export class FamiliaMuebleSearchGQL extends Query<Response> {
  override document = familiaMuebleSearchQuery;
}
