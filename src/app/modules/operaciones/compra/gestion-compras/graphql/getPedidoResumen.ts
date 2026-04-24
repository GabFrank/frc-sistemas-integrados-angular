import { Injectable } from '@angular/core';
import { Apollo, Query } from 'apollo-angular';
import { gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getPedidoResumenQuery } from './graphql-query';

export interface PedidoResumen {
  pedidoId: string;
  etapaActual: {
    id: string;
    pedido: {
      id: string;
    };
    tipoEtapa: string;
    estadoEtapa: string;
    fechaInicio: string;
    fechaFin: string;
    usuarioInicio: {
      id: string;
      persona: {
        nombre: string;
      };
    };
    creadoEn: string;
  };
  cantidadItems: number;
  valorTotal: number;
  valorTotalPedido: number;
  cantidadItemsConDistribucionCompleta: number;
  cantidadItemsPendientesDistribucion: number;
}

export interface GetPedidoResumenResponse {
  getPedidoResumen: PedidoResumen;
}

@Injectable({
  providedIn: 'root'
})
export class GetPedidoResumenGQL extends Query<GetPedidoResumenResponse, { pedidoId: number }> {
  document = getPedidoResumenQuery;
} 