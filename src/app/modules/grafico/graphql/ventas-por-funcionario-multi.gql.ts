import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import gql from "graphql-tag";
import { GRAFICO_MULTI_FRAGMENTS } from "./grafico-multi.fragments";

@Injectable({ providedIn: "root" })
export class VentasPorFuncionarioMultiGQL extends Query<any> {
  override document = gql`
    query ventasPorFuncionarioMulti(
      $periodos: [PeriodoGraficoInput!]!
      $sucIds: [ID]
      $usuarioIds: [ID]
    ) {
      data: ventasPorFuncionarioMulti(
        periodos: $periodos
        sucIds: $sucIds
        usuarioIds: $usuarioIds
      ) {
        id
        funcionario
        total
        cantidad
        productoMasVendido
        sucursales
        ${GRAFICO_MULTI_FRAGMENTS.DESGLOSE_PERIODO}
      }
    }
  `;
}
