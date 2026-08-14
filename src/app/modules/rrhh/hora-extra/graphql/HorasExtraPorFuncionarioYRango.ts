import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { HoraExtra } from '../hora-extra.model';
import { horasExtraPorFuncionarioYRangoQuery } from './graphql-query';

export interface Response {
  data: HoraExtra[];
}

@Injectable({ providedIn: 'root' })
export class HorasExtraPorFuncionarioYRangoGQL extends Query<Response> {
  document = horasExtraPorFuncionarioYRangoQuery;
}
