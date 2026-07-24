import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { EvolucionCostoResponse } from '../evolucion-costo/interfaces/evolucion-costo-response.model';

export interface Response {
  data: EvolucionCostoResponse;
}

const evolucionCostoProductoQuery = gql`
  query evolucionCostoProducto($inicio: String, $fin: String, $productoId: ID!, $sucursalId: ID, $agrupacion: String) {
    data: evolucionCostoProducto(inicio: $inicio, fin: $fin, productoId: $productoId, sucursalId: $sucursalId, agrupacion: $agrupacion) {
      periodos {
        periodo
        costoPromedio
        costoMinimo
        costoMaximo
        cantidad
        cantidadCompras
      }
      resumen {
        costoInicial
        costoFinal
        variacionPorcentual
        costoPromedioPonderado
        periodoConMayorCosto
        totalCompras
        hayDatos
      }
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class EvolucionCostoProductoGQL extends Query<Response> {
  document = evolucionCostoProductoQuery;
}
