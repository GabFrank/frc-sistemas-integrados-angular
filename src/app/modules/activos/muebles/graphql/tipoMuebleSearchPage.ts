import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TipoMueble } from '../models/tipo-mueble.model';
import { PageInfo } from '../../../../app.component';
import { tipoMuebleSearchPageQuery } from './graphql-query';

export interface Response {
  data: PageInfo<TipoMueble>;
}

@Injectable({
  providedIn: 'root',
})
export class TipoMuebleSearchPageGQL extends Query<Response> {
  override document = tipoMuebleSearchPageQuery;
}
