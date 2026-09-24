import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { stockPorSucursales } from './graphql-query';

/**
 * Fila cruda tal como vuelve del central.
 *
 * `sucursalId` es `ID` en el schema, y GraphQL serializa los `ID` como string,
 * igual que el `sucursal.id` de cualquier otra query aunque el modelo lo declare
 * `number`. La normalización la hace `PorSucursal`, en
 * `ProductoService.onGetStockPorSucursales`, para que ningún consumidor tenga que
 * acordarse.
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
