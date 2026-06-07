import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { ModeloEquipo } from '../models/modelo-equipo.model';
import { modeloEquipoSearchPageQuery } from './graphql-query';

export interface Response {
  data: PageInfo<ModeloEquipo>;
}

@Injectable({
  providedIn: 'root',
})
export class ModeloEquipoSearchPageGQL extends Query<Response> {
  override document = modeloEquipoSearchPageQuery;
}
