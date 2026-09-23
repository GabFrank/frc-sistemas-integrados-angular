import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cantidadSugeridaPorSucursalesQuery } from './graphql-query';

/**
 * Fila cruda tal como vuelve del central.
 *
 * `sucursalId` es `ID` en el schema y GraphQL serializa los `ID` como string: compararlo contra
 * `sucursal.id` (number) con `===` da siempre false. La conversión la hace
 * `MovimientoStockService.onGetCantidadSugeridaPorSucursales`, para que ningún consumidor tenga
 * que acordarse. Mismo criterio que `StockPorSucursalRaw` en el módulo de productos.
 *
 * Las fechas usan el escalar `Date`, el mismo de `MovimientoStock.creadoEn`.
 */
export interface CantidadSugeridaPorSucursalRaw {
  sucursalId: string;
  totalVentas: number;
  cantidadCompras: number;
  primeraCompra: string;
  ultimaCompra: string;
}

export interface Response {
  data: CantidadSugeridaPorSucursalRaw[];
}

@Injectable({
  providedIn: 'root',
})
export class GetCantidadSugeridaPorSucursalesGQL extends Query<Response> {
  document = cantidadSugeridaPorSucursalesQuery;
}
