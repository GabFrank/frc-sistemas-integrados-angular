import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cambio } from '../cambio.model';
import { cambiosQuery, cambioPorFechaQuery } from './graphql-query';

export interface Response {
  data: Cambio[];
}

@Injectable({
  providedIn: 'root',
})
export class CambiosGetAllByDateGQL extends Query<Response> {
  document = cambioPorFechaQuery;
}
