import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { PrecioPorSucursal } from '../precio-por-sucursal.model';
import { preciosPorSucursalPorSucursalId, savePrecioPorSucursal } from './graphql-query';

export interface Response {
  data: PrecioPorSucursal[];
}


@Injectable({
  providedIn: 'root',
})
export class PrecioPorSucursalPorSucursalIdGQL extends Query<Response> {
  document = preciosPorSucursalPorSucursalId;
}


