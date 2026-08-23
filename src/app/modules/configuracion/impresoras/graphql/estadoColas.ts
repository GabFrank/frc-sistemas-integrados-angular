import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ColaEstado } from '../impresora.model';
import { estadoColasQuery } from './graphql-query';

export interface Response {
  data: ColaEstado[];
}

@Injectable({
  providedIn: 'root',
})
export class EstadoColasGQL extends Query<Response> {
  document = estadoColasQuery;
}
