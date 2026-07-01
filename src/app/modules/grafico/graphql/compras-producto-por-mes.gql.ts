import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { ProductoCompraPorPeriodo } from '../producto-vendido/interfaces/producto-compra-periodo.model';

export interface Response {
  data: ProductoCompraPorPeriodo[];
}

const comprasProductoPorMesQuery = gql`
  query comprasProductoPorMes($inicio: String, $fin: String, $productoId: ID!, $sucursalId: ID) {
    data: comprasProductoPorMes(inicio: $inicio, fin: $fin, productoId: $productoId, sucursalId: $sucursalId) {
      periodo
      cantidad
      cantidadCompras
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ComprasProductoPorMesGQL extends Query<Response> {
  document = comprasProductoPorMesQuery;
}
