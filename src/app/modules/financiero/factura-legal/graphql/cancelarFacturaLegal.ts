import { Injectable } from "@angular/core";
import gql from "graphql-tag";
import { Mutation } from "apollo-angular";

export const cancelarFacturaLegalQuery = gql`
  mutation cancelarFacturaLegal(
    $facturaLegalId: ID!
    $sucursalId: ID!
    $cancelarVenta: Boolean!
  ) {
    data: cancelarFacturaLegal(
      facturaLegalId: $facturaLegalId
      sucursalId: $sucursalId
      cancelarVenta: $cancelarVenta
    )
  }
`;

@Injectable({
  providedIn: "root",
})
export class CancelarFacturaLegalGQL extends Mutation {
  document = cancelarFacturaLegalQuery;
}
