import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import gql from "graphql-tag";
import { GRAFICO_MULTI_FRAGMENTS } from "./grafico-multi.fragments";

@Injectable({ providedIn: "root" })
export class VentasPorSucursalMultiGQL extends Query<any> {
  override document = gql`
    query ventasPorSucursalMulti($periodos: [PeriodoGraficoInput!]!) {
      data: ventasPorSucursalMulti(periodos: $periodos) {
        sucId
        nombre
        total
        ${GRAFICO_MULTI_FRAGMENTS.DESGLOSE_PERIODO}
      }
    }
  `;
}
