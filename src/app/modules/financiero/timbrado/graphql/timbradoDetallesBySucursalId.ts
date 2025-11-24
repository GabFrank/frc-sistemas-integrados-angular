import { Query } from "apollo-angular";
import { timbradoDetallesBySucursalIdQuery } from "./graphql-query";
import { TimbradoDetalle } from "../timbrado.modal";
import { Injectable } from "@angular/core";

export interface Response {
  data: TimbradoDetalle[];
}

@Injectable({
  providedIn: 'root',
})
export class TimbradoDetallesBySucursalIdGQL extends Query<Response> {
  document = timbradoDetallesBySucursalIdQuery;
}

