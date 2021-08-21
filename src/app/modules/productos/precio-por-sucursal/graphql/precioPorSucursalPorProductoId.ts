import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PrecioPorSucursal } from '../precio-por-sucursal.model';
import { precioPorSucursalPorProductoId, preciosPorSucursalPorCodigoId} from './graphql-query';

export interface Response {
  data: PrecioPorSucursal[];
}


@Injectable({
  providedIn: 'root',
})
export class PrecioPorSucursalPorProductoIdGQL extends Query<Response> {
  document = precioPorSucursalPorProductoId;
}


