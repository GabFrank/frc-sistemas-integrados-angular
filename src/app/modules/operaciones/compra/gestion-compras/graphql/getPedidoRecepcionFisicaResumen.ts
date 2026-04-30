import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { DocumentNode } from 'graphql';
import { getPedidoRecepcionFisicaResumenQuery } from './graphql-query';

export interface SucursalRecepcionFisica {
  sucursalId: number;
  sucursalNombre: string;
  cantidadItemsRecepcionados: number;
  fechaUltimaRecepcion: string;
}

export interface PedidoRecepcionFisicaResumen {
  pedidoId: number;
  totalSucursalesRecepcionFisica: number;
  sucursalesRecepcionFisica: SucursalRecepcionFisica[];
}

export interface GetPedidoRecepcionFisicaResumenResponse {
  data: PedidoRecepcionFisicaResumen;
}

@Injectable({
  providedIn: 'root'
})
export class GetPedidoRecepcionFisicaResumenGQL extends Query<GetPedidoRecepcionFisicaResumenResponse> {
  document: DocumentNode = getPedidoRecepcionFisicaResumenQuery;
}
