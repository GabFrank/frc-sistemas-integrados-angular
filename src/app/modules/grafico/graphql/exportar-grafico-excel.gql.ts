import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import gql from "graphql-tag";
import {
  GraficoExcelExportInput,
  GraficoExcelTipo,
} from "../utils/grafico-excel-export.model";

@Injectable({ providedIn: "root" })
export class ExportarGraficoExcelGQL extends Query<{ data: string }> {
  override document = gql`
    query exportarGraficoExcel(
      $tipo: GraficoExcelTipo!
      $input: GraficoExcelExportInput!
    ) {
      data: exportarGraficoExcel(tipo: $tipo, input: $input)
    }
  `;

  static variables(tipo: GraficoExcelTipo, input: GraficoExcelExportInput) {
    return {
      tipo,
      input: {
        ...input,
        sucIds: input.sucIds?.length ? input.sucIds.map(String) : null,
        usuarioIds: input.usuarioIds?.length
          ? input.usuarioIds.map(String)
          : null,
        familiaId: input.familiaId != null ? String(input.familiaId) : null,
        productoIds: input.productoIds?.length
          ? input.productoIds.map(String)
          : null,
      },
    };
  }
}
