import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cambio } from '../cambio.model';
import { cambiosSearch } from './graphql-query';

export interface Response {
  cambios: Cambio[];
}

@Injectable({
  providedIn: 'root',
})
export class CambiosSearchGQL extends Query<Response> {
  document = cambiosSearch;
}
