import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import gql from "graphql-tag";
import { ResumenFiscalVentas } from "../resumen-fiscal-ventas/resumen-fiscal-ventas.model";

@Injectable({ providedIn: "root" })
export class ResumenFiscalVentasGQL extends Query<{ data: ResumenFiscalVentas }> {
  override document = gql`
    query resumenFiscalVentas($anio: Int!, $mes: Int!, $sucIds: [ID]) {
      data: resumenFiscalVentas(anio: $anio, mes: $mes, sucIds: $sucIds) {
        anio
        mes
        periodo
        sucursalesFiltro
        contribuyentes {
          ruc
          razonSocial
          gravada10
          iva10
          gravada5
          iva5
          exentas
          totalBase
          totalIva
          totalFacturado
          emitidas
          anuladas
          detalle {
            sucursalId
            sucursal
            timbrado
            tipo
            numeroDesde
            numeroHasta
            emitidas
            anuladas
            gravada10
            iva10
            gravada5
            iva5
            exentas
            totalFacturado
          }
        }
      }
    }
  `;
}

@Injectable({ providedIn: "root" })
export class ImprimirResumenFiscalVentasGQL extends Query<{ data: string }> {
  override document = gql`
    query imprimirResumenFiscalVentas($anio: Int!, $mes: Int!, $sucIds: [ID]) {
      data: imprimirResumenFiscalVentas(anio: $anio, mes: $mes, sucIds: $sucIds)
    }
  `;
}
