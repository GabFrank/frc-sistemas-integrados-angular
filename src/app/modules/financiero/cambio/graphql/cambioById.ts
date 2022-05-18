import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cambio } from '../cambio.model';
import { cambioQuery } from './graphql-query';

export interface Response {
  cambio: Cambio;
}

@Injectable({
  providedIn: 'root',
})
export class CambioByIdGQL extends Query<Response> {
  document = cambioQuery;
}
