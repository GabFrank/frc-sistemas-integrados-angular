import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { pedidoRecepcionMercaderiaSummaryQuery } from './graphql-query';

export interface PedidoRecepcionMercaderiaSummary {
  totalItems: number;
  verificados: number;
  pendientes: number;
  sucursales: number;
}

export interface Response {
  data: PedidoRecepcionMercaderiaSummary;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoRecepcionMercaderiaSummaryGQL extends Query<Response> {
  document = pedidoRecepcionMercaderiaSummaryQuery;
} 