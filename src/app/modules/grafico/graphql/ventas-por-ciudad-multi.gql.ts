import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import gql from "graphql-tag";
import { GRAFICO_MULTI_FRAGMENTS } from "./grafico-multi.fragments";

@Injectable({ providedIn: "root" })
export class VentasPorCiudadMultiGQL extends Query<any> {
  override document = gql`
    query ventasPorCiudadMulti($periodos: [PeriodoGraficoInput!]!) {
      data: ventasPorCiudadMulti(periodos: $periodos) {
        ciudadId
        nombre
        total
        cantidadVentas
        ${GRAFICO_MULTI_FRAGMENTS.DESGLOSE_PERIODO}
      }
    }
  `;
}
