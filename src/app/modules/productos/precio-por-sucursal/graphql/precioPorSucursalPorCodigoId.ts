import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PrecioPorSucursal } from '../precio-por-sucursal.model';
import { preciosPorSucursalPorCodigoId} from './graphql-query';

export interface Response {
  data: PrecioPorSucursal[];
}


@Injectable({
  providedIn: 'root',
})
export class PrecioPorSucursalPorCodigoIdGQL extends Query<Response> {
  document = preciosPorSucursalPorCodigoId;
}


