import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Maletin } from '../maletin.model';
import { maletinesConFiltrosQuery } from './graphql-query';

export interface Response {
  data: PageInfo<Maletin>;
}

@Injectable({
  providedIn: 'root',
})
export class MaletinesConFiltrosGQL extends Query<Response> {
  document = maletinesConFiltrosQuery;
}
