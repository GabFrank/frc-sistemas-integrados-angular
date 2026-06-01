import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { ProductoVentaPorPeriodo } from '../interfaces/producto-venta-periodo.model';

export interface Response {
  data: ProductoVentaPorPeriodo[];
}

const ventasProductoPorMesQuery = gql`
  query ventasProductoPorMes($inicio: String, $fin: String, $productoId: ID!, $sucursalId: ID) {
    data: ventasProductoPorMes(inicio: $inicio, fin: $fin, productoId: $productoId, sucursalId: $sucursalId) {
      periodo
      cantidad
      totalMonto
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class VentasProductoPorMesGQL extends Query<Response> {
  document = ventasProductoPorMesQuery;
}
