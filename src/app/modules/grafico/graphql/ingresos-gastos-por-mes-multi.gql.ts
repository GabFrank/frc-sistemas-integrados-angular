import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import gql from "graphql-tag";

@Injectable({ providedIn: "root" })
export class IngresosGastosPorMesMultiGQL extends Query<any> {
  override document = gql`
    query ingresosGastosPorMesMulti($anios: [Int!]!, $sucIds: [ID]) {
      data: ingresosGastosPorMesMulti(anios: $anios, sucIds: $sucIds) {
        anio
        sucId
        sucursalNombre
        ingresos {
          mes
          total
          cantidad
          efvo
          tarjeta
          otros
        }
        gastos {
          mes
          total
          cantidad
        }
      }
    }
  `;
}
