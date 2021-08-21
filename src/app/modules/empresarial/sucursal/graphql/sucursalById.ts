import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Sucursal } from '../sucursal.model';
import { sucursalQuery } from './graphql-query';

export interface Response {
  data: Sucursal;
}

@Injectable({
  providedIn: 'root',
})
export class SucursalByIdGQL extends Query<Response> {
  document = sucursalQuery;
}
