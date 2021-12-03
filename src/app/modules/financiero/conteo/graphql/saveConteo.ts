import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Conteo } from '../conteo.model';
import { saveConteo } from './graphql-query';

export interface Response {
  data: Conteo;
}

@Injectable({
  providedIn: 'root',
})
export class SaveConteoGQL extends Mutation<Response> {
  document = saveConteo;
}
