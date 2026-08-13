import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Feriado } from '../feriado.model';
import { feriadosQuery } from './graphql-query';

export interface Response {
  data: Feriado[];
}

@Injectable({ providedIn: 'root' })
export class FeriadosGQL extends Query<Response> {
  document = feriadosQuery;
}
