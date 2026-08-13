import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TipoJustificativo } from '../justificativo.model';
import { tiposJustificativoActivosQuery } from './graphql-query';

export interface Response {
  data: TipoJustificativo[];
}

@Injectable({ providedIn: 'root' })
export class TiposJustificativoActivosGQL extends Query<Response> {
  document = tiposJustificativoActivosQuery;
}
