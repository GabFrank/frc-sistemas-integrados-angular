import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import gql from "graphql-tag";

@Injectable({ providedIn: "root" })
export class VentasPorHoraMultiGQL extends Query<any> {
  override document = gql`
    query ventasPorHoraMulti($periodos: [PeriodoGraficoInput!]!, $sucIds: [ID]) {
      data: ventasPorHoraMulti(periodos: $periodos, sucIds: $sucIds) {
        sucId
        sucursalNombre
        etiqueta
        fecha
        datos {
          hora
          total
          cantidad
        }
      }
    }
  `;
}
