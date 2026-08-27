import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { DispositivoDetectado } from '../impresora.model';
import { recursosSmbQuery } from './graphql-query';

export interface Response {
  data: DispositivoDetectado[];
}

@Injectable({
  providedIn: 'root',
})
export class RecursosSmbGQL extends Query<Response> {
  document = recursosSmbQuery;
}
