import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Modelo } from '../models/modelo.model';
import { modeloSearchPageQuery } from './aux-graphql-query';

export interface Response {
  data: PageInfo<Modelo>;
}

@Injectable({
  providedIn: 'root',
})
export class ModeloSearchPageGQL extends Query<Response> {
  override document = modeloSearchPageQuery;
}
