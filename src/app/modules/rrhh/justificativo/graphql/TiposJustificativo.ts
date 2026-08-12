import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TipoJustificativo } from '../justificativo.model';
import { tiposJustificativoQuery } from './graphql-query';

export interface Response {
  data: TipoJustificativo[];
}

@Injectable({ providedIn: 'root' })
export class TiposJustificativoGQL extends Query<Response> {
  document = tiposJustificativoQuery;
}
