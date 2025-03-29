import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Ciudad } from '../ciudad.model';
import { ciudadesSearch } from './graphql-query';

export interface Response {
  data: Ciudad[];
}

@Injectable({
  providedIn: 'root',
})
export class CiudadesSearchGQL extends Query<Response> {
  document = ciudadesSearch;
} 