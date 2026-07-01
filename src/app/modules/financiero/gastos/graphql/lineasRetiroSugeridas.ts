import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { LineaRetiroSugerida } from '../models/linea-retiro-sugerida.model';
import { lineasRetiroSugeridasQuery } from './graphql-query';

export interface Response {
  data: LineaRetiroSugerida[];
}

@Injectable({ providedIn: 'root' })
export class LineasRetiroSugeridasGQL extends Query<Response> {
  document = lineasRetiroSugeridasQuery;
}
