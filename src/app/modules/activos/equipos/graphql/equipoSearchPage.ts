import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Equipo } from '../models/equipo.model';
import { equipoSearchPageQuery } from './graphql-query';

export interface Response {
  data: PageInfo<Equipo>;
}

@Injectable({
  providedIn: 'root',
})
export class EquipoSearchPageGQL extends Query<Response> {
  override document = equipoSearchPageQuery;
}
