import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Ciudad } from '../ciudad.model';
import { ciudadQuery } from './graphql-query';

export interface Response {
  data: Ciudad;
}

@Injectable({
  providedIn: 'root',
})
export class CiudadGQL extends Query<Response> {
  document = ciudadQuery;
} 