import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import gql from "graphql-tag";
import { GRAFICO_MULTI_FRAGMENTS } from "./grafico-multi.fragments";

@Injectable({ providedIn: "root" })
export class FormaPagoEstadisticasMultiGQL extends Query<any> {
  override document = gql`
    query formaPagoEstadisticasMulti(
      $periodos: [PeriodoGraficoInput!]!
      $sucIds: [ID]
    ) {
      data: formaPagoEstadisticasMulti(periodos: $periodos, sucIds: $sucIds) {
        formaPagoId
        descripcion
        cantidadTransacciones
        totalMonto
        porcentaje
        desgloseMoneda {
          monedaId
          denominacion
          simbolo
          cantidadTransacciones
          totalMonto
        }
        ${GRAFICO_MULTI_FRAGMENTS.DESGLOSE_PERIODO}
      }
    }
  `;
}
