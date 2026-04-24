import { Query } from "apollo-angular";
import { timbradoDetallesQuery } from "./graphql-query";
import { TimbradoDetalle } from "../timbrado.modal";
import { Injectable } from "@angular/core";

export interface Response {
  data: TimbradoDetalle[];
}

@Injectable({
  providedIn: 'root',
})
export class TimbradoDetallesGQL extends Query<Response> {
  document = timbradoDetallesQuery;
}