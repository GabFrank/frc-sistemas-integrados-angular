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
      data: facturaLegalByCdc(cdc: $cdc) {
        id
        sucursalId
        nombre
        ruc
        cdc
        totalFinal
        creadoEn
        activo
        numeroFactura
        sucursal {
          id
          nombre
          codigoEstablecimientoFactura
        }
        timbradoDetalle {
          id
          puntoExpedicion
        }
        cliente {
          id
          persona {
            nombre
            documento
            email
          }
        }
        venta {
          id
        }
        documentoElectronico {
          id
          cdc
          estado
        }
      }
    }
  `;
}
