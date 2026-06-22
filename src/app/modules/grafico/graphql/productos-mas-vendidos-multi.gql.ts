import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import gql from "graphql-tag";
import { GRAFICO_MULTI_FRAGMENTS } from "./grafico-multi.fragments";

@Injectable({ providedIn: "root" })
export class ProductosMasVendidosMultiGQL extends Query<any> {
  override document = gql`
    query productosMasVendidosMulti(
      $periodos: [PeriodoGraficoInput!]!
      $sucIds: [ID]
      $limit: Int
      $familiaId: ID
      $ascendente: Boolean
      $productoIds: [ID]
    ) {
      data: productosMasVendidosMulti(
        periodos: $periodos
        sucIds: $sucIds
        limit: $limit
        familiaId: $familiaId
        ascendente: $ascendente
        productoIds: $productoIds
      ) {
        productoId
        descripcion
        cantidad
        totalMonto
        porcentaje
        cantidadEntrada
        cantidadVentaMovimiento
        indiceRotacion
        ${GRAFICO_MULTI_FRAGMENTS.DESGLOSE_PERIODO}
      }
    }
  `;
}
