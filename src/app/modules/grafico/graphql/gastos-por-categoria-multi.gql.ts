import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import gql from "graphql-tag";
import { GRAFICO_MULTI_FRAGMENTS } from "./grafico-multi.fragments";

@Injectable({ providedIn: "root" })
export class GastosPorCategoriaMultiGQL extends Query<any> {
  override document = gql`
    query gastosPorCategoriaMulti(
      $periodos: [PeriodoGraficoInput!]!
      $sucIds: [ID]
    ) {
      data: gastosPorCategoriaMulti(periodos: $periodos, sucIds: $sucIds) {
        categoria
        total
        cantidad
        ${GRAFICO_MULTI_FRAGMENTS.DESGLOSE_PERIODO}
      }
    }
  `;
}
