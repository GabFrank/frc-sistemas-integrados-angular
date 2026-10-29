import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import gql from "graphql-tag";

const CONTEO = `total abiertas finalizadas canceladas otras`;

@Injectable({ providedIn: "root" })
export class ConvenioIntegridadPorSucursalGQL extends Query<any> {
  override document = gql`
    query convenioIntegridadPorSucursal(
      $fechaInicio: String!
      $fechaFin: String!
      $estado: EstadoVentaCredito
      $sucIds: [ID]
    ) {
      data: convenioIntegridadPorSucursal(
        fechaInicio: $fechaInicio
        fechaFin: $fechaFin
        estado: $estado
        sucIds: $sucIds
      ) {
        sucursalId
        sucursalNombre
        central { ${CONTEO} }
        filial { ${CONTEO} }
        estadoIntegridad
        error
        faltanEnCentral
        sobranEnCentral
        estadoDistinto
        idsFaltanEnCentral
        idsSobranEnCentral
        idsEstadoDistinto
        ultimoCentral
        ultimoFilial
      }
    }
  `;
}
