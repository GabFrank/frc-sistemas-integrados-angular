import { Injectable } from "@angular/core";
import gql from "graphql-tag";
import { Mutation } from "apollo-angular";

export const updateFacturaLegalQuery = gql`
  mutation updateFacturaLegal($input: FacturaLegalInput!) {
    data: updateFacturaLegal(input: $input) {
      id
      sucursalId
      numeroFactura
      cliente {
        id
        persona {
          id
          nombre
          documento
        }
      }
      nombre
      ruc
      direccion
      cdc
      fecha
      totalFinal
      activo
      creadoEn
      sucursal {
        id
        nombre
        codigoEstablecimientoFactura
      }
      timbradoDetalle {
        id
        puntoExpedicion
      }
      documentoElectronico {
        id
        estado
        cdc
      }
    }
  }
`;

@Injectable({
  providedIn: "root",
})
export class UpdateFacturaLegalGQL extends Mutation {
  document = updateFacturaLegalQuery;
}

