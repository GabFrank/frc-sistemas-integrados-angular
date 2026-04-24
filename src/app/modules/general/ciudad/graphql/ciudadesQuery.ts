import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Ciudad } from '../ciudad.model';
import { ciudadesQuery } from './graphql-query';

export interface Response {
  data: Ciudad[];
}

@Injectable({
  providedIn: 'root',
})
export class CiudadesGQL extends Query<Response> {
  document = ciudadesQuery;
} 