import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { ProductoVendidoEstadistica } from '../models/producto-vendido-estadistica.model';

export interface Response {
  data: ProductoVendidoEstadistica[];
}

const productosMasVendidosQuery = gql`
  query productosMasVendidos($inicio: String, $fin: String, $limit: Int, $sucursalId: ID, $familiaId: ID) {
    data: productosMasVendidos(inicio: $inicio, fin: $fin, limit: $limit, sucursalId: $sucursalId, familiaId: $familiaId) {
      productoId
      descripcion
      cantidad
      totalMonto
      porcentaje
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ProductosMasVendidosGQL extends Query<Response> {
  document = productosMasVendidosQuery;
}
