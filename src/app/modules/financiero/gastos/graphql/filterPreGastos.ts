import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { PreGasto } from '../models/pre-gasto.model';
import { filterPreGastosQuery } from './graphql-query';

export interface Response {
  data: PageInfo<PreGasto>;
}

@Injectable({
  providedIn: 'root',
})
export class FilterPreGastosGQL extends Query<Response> {
  document = filterPreGastosQuery;
}
