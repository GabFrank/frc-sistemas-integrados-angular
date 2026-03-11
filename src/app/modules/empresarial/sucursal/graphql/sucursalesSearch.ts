import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Sucursal } from '../sucursal.model';
import { sucursalesSearch } from './graphql-query';
import { PageInfo } from '../../../../app.component';

export interface Response {
  data: PageInfo<Sucursal>;
}


@Injectable({
  providedIn: 'root',
})
export class SucursalesSearchGQL extends Query<Response> {
  document = sucursalesSearch;
}
