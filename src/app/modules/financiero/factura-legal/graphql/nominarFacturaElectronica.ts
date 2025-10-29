import { Injectable } from "@angular/core";
import gql from "graphql-tag";
import { Mutation } from "apollo-angular";

export const nominarFacturaElectronicaQuery = gql`
  mutation nominarFacturaElectronica(
    $facturaLegalId: ID!
    $sucursalId: ID!
    $clienteId: ID!
  ) {
    data: nominarFacturaElectronica(
      facturaLegalId: $facturaLegalId
      sucursalId: $sucursalId
      clienteId: $clienteId
    )
  }
`;

@Injectable({
  providedIn: "root",
})
export class NominarFacturaElectronicaGQL extends Mutation {
  document = nominarFacturaElectronicaQuery;
}

