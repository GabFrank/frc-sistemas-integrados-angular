import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { stockPorSucursales } from './graphql-query';

/**
 * Fila cruda tal como vuelve del central.
 *
 * `sucursalId` es `ID` en el schema, y GraphQL serializa los `ID` como string:
 * compararlo contra `sucursal.id` (number) con `===` da siempre false. La
 * conversión la hace `ProductoService.onGetStockPorSucursales`, para que ningún
 * consumidor tenga que acordarse.
 */
export interface StockPorSucursalRaw {
  sucursalId: string;
  cantidad: number;
}

export interface Response {
  data: StockPorSucursalRaw[];
}

@Injectable({
  providedIn: 'root',
})
export class StockPorSucursalesGQL extends Query<Response> {
  document = stockPorSucursales;
}
