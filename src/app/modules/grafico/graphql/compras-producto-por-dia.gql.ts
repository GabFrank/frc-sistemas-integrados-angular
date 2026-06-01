import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { ProductoCompraPorPeriodo } from '../interfaces/producto-compra-periodo.model';

export interface Response {
  data: ProductoCompraPorPeriodo[];
}

const comprasProductoPorDiaQuery = gql`
  query comprasProductoPorDia($inicio: String, $fin: String, $productoId: ID!, $sucursalId: ID) {
    data: comprasProductoPorDia(inicio: $inicio, fin: $fin, productoId: $productoId, sucursalId: $sucursalId) {
      periodo
      cantidad
      cantidadCompras
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ComprasProductoPorDiaGQL extends Query<Response> {
  document = comprasProductoPorDiaQuery;
}
