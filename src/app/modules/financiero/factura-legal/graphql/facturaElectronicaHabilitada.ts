import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import gql from "graphql-tag";

/** Si el filial factura electrónico: el país del cliente solo importa en ese caso (#134). */
export const facturaElectronicaHabilitadaQuery = gql`
  query {
    data: facturaElectronicaHabilitada
  }
`;

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: "root",
})
export class FacturaElectronicaHabilitadaGQL extends Query<Response> {
  document = facturaElectronicaHabilitadaQuery;
}
