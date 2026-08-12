import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Justificativo } from '../justificativo.model';
import { justificativosPorFuncionarioYRangoQuery } from './graphql-query';

export interface Response {
  data: Justificativo[];
}

@Injectable({ providedIn: 'root' })
export class JustificativosPorFuncionarioYRangoGQL extends Query<Response> {
  document = justificativosPorFuncionarioYRangoQuery;
}
