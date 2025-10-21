import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { FacturaLegal } from "../factura-legal.model";
import gql from "graphql-tag";

@Injectable({
  providedIn: "root",
})
export class FacturaLegalByCdcGQL extends Query<FacturaLegal> {
  document = gql`
    query FacturaLegalByCdc($cdc: String!) {
      facturaLegalByCdc(cdc: $cdc) {
        id
        sucursalId
        nombre
        ruc
        totalFinal
        creadoEn
        sucursal {
          id
          nombre
        }
      }
    }
  `;
}
