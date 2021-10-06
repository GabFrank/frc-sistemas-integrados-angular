import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PrecioPorSucursal } from '../precio-por-sucursal.model';
import { precioPorSucursalPorPresentacionId } from './graphql-query';


export interface Response {
  data: PrecioPorSucursal[];
}

@Injectable({
  providedIn: 'root',
})
export class PrecioPorSucursalPorPresentacionIdGQL extends Query<Response> {
  document = precioPorSucursalPorPresentacionId;
}
