import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { TipoGasto } from '../models/tipo-gasto.model';
import { filterTipoGastosQuery } from './graphql-query';

export interface Response {
  data: PageInfo<TipoGasto>;
}

@Injectable({
  providedIn: 'root',
})
export class FilterTipoGastosGQL extends Query<Response> {
  document = filterTipoGastosQuery;
}
