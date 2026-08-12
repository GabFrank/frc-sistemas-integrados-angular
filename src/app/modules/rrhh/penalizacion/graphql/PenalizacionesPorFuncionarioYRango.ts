import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Penalizacion } from '../penalizacion.model';
import { penalizacionesPorFuncionarioYRangoQuery } from './graphql-query';

export interface Response {
  data: Penalizacion[];
}

@Injectable({ providedIn: 'root' })
export class PenalizacionesPorFuncionarioYRangoGQL extends Query<Response> {
  document = penalizacionesPorFuncionarioYRangoQuery;
}
