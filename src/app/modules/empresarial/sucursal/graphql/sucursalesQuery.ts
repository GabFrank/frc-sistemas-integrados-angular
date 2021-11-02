import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Sucursal } from '../sucursal.model';
import { sucursalesQuery, sucursalQuery } from './graphql-query';

export interface Response {
  data: Sucursal[];
}

@Injectable({
  providedIn: 'root',
})
export class SucursalesGQL extends Query<Sucursal[]> {
  document = sucursalesQuery;
}
