import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { JornadaNovedad } from '../jornada-novedad.model';
import { novedadesPorFuncionarioYRangoQuery } from './graphql-query';

export interface Response {
  data: JornadaNovedad[];
}

@Injectable({ providedIn: 'root' })
export class NovedadesPorFuncionarioYRangoGQL extends Query<Response> {
  document = novedadesPorFuncionarioYRangoQuery;
}
