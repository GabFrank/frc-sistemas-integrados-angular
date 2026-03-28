import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FamiliaMueble } from '../models/familia-mueble.model';
import { PageInfo } from '../../../../app.component';
import { familiaMuebleSearchPageQuery } from './graphql-query';

export interface Response {
  data: PageInfo<FamiliaMueble>;
}

@Injectable({
  providedIn: 'root',
})
export class FamiliaMuebleSearchPageGQL extends Query<Response> {
  override document = familiaMuebleSearchPageQuery;
}
