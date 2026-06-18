import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { TipoEquipo } from '../models/tipo-equipo.model';
import { tipoEquipoSearchPageQuery } from './graphql-query';

export interface Response {
  data: PageInfo<TipoEquipo>;
}

@Injectable({
  providedIn: 'root',
})
export class TipoEquipoSearchPageGQL extends Query<Response> {
  override document = tipoEquipoSearchPageQuery;
}
