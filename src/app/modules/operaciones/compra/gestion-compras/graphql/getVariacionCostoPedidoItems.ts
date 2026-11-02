import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { variacionCostoPedidoItemsQuery } from './pedido-item-graphql-query';

/** Dirección del cambio de costo según el central. */
export type DireccionVariacionCosto = 'SUBIO' | 'BAJO' | 'IGUAL' | 'SIN_HISTORIAL';

export interface VariacionCostoPedidoItem {
  /** GraphQL manda los ID como string. */
  pedidoItemId: string;
  precioActual?: number;
  ultimoPrecio?: number;
  /** Fracción: 0.12 = +12 %. */
  variacion?: number;
  direccion: DireccionVariacionCosto;
  /** Texto listo para el tooltip; null si IGUAL o SIN_HISTORIAL. */
  texto?: string;
}

export interface GetVariacionCostoPedidoItemsVariables {
  pedidoId: number;
}

export interface GetVariacionCostoPedidoItemsResponse {
  data: VariacionCostoPedidoItem[];
}

@Injectable({
  providedIn: 'root',
})
export class GetVariacionCostoPedidoItemsGQL extends Query<GetVariacionCostoPedidoItemsResponse, GetVariacionCostoPedidoItemsVariables> {
  document = variacionCostoPedidoItemsQuery;
}
