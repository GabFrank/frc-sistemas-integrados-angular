import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

/**
 * La moneda con que se guardó una venta (Fase 4). Es una consulta aparte y no campos de `ventaQuery` o
 * `deliveryQuery`: un filial anterior no tiene esos campos y rechazaría la consulta entera. Solo se hace con otra
 * moneda del PDV.
 */
export const ventaMonedaQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: venta(id: $id, sucId: $sucId) {
      id
      cotizacion
      totalMoneda
      moneda {
        id
      }
    }
  }
`;

export interface VentaMoneda {
  id: number;
  cotizacion: number | null;
  totalMoneda: number | null;
  moneda: { id: number } | null;
}

class Response {
  data: VentaMoneda;
}

@Injectable({
  providedIn: 'root',
})
export class VentaMonedaGQL extends Query<Response> {
  document = ventaMonedaQuery;
}
