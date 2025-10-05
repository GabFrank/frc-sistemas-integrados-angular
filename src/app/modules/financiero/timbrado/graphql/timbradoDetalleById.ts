import { Query } from "apollo-angular";
import { timbradoDetalleQuery } from "./graphql-query";
import { TimbradoDetalle } from "../timbrado.modal";
import { Injectable } from "@angular/core";

export interface Response {
  data: TimbradoDetalle;
}

@Injectable({
  providedIn: 'root',
})

export class TimbradoDetalleByIdGQL extends Query<Response> {
  document = timbradoDetalleQuery;
}