import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { RankingInflacionItem } from '../ranking-inflacion/interfaces/ranking-inflacion-item.model';

export interface Response {
  data: RankingInflacionItem[];
}

const rankingInflacionCostoQuery = gql`
  query rankingInflacionCosto($inicio: String, $fin: String, $sucursalId: ID, $familiaId: ID, $limit: Int, $orden: String) {
    data: rankingInflacionCosto(inicio: $inicio, fin: $fin, sucursalId: $sucursalId, familiaId: $familiaId, limit: $limit, orden: $orden) {
      productoId
      descripcion
      costoInicial
      costoFinal
      variacionPorcentual
      periodos
      totalCompras
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class RankingInflacionCostoGQL extends Query<Response> {
  document = rankingInflacionCostoQuery;
}
