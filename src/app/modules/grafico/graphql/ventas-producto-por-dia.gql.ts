import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { ProductoVentaPorPeriodo } from '../models/producto-venta-periodo.model';

export interface Response {
  data: ProductoVentaPorPeriodo[];
}

const ventasProductoPorDiaQuery = gql`
  query ventasProductoPorDia($inicio: String, $fin: String, $productoId: ID!, $sucursalId: ID) {
    data: ventasProductoPorDia(inicio: $inicio, fin: $fin, productoId: $productoId, sucursalId: $sucursalId) {
      periodo
      cantidad
      totalMonto
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class VentasProductoPorDiaGQL extends Query<Response> {
  document = ventasProductoPorDiaQuery;
}
