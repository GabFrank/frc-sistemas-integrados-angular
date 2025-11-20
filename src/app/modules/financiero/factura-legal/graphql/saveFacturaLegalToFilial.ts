import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { saveFacturaLegalToFilialQuery } from "./graphql-query";

export interface SaveFacturaLegalToFilialResponse {
  facturaId: number;
  numeroFactura: number;
  cdc: string;
  urlQr: string;
  estadoDocumentoElectronico: string;
  mensajeRespuestaSifen: string;
  documentoElectronicoGenerado: boolean;
}

export interface Response {
  data: SaveFacturaLegalToFilialResponse;
}

@Injectable({
  providedIn: "root",
})
export class SaveFacturaLegalToFilialGQL extends Mutation<Response> {
  document = saveFacturaLegalToFilialQuery;
}

