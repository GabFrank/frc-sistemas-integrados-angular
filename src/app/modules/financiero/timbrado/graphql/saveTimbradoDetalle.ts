import { Mutation } from "apollo-angular";
import { saveTimbradoDetalleQuery } from "./graphql-query";
import { TimbradoDetalle } from "../timbrado.modal";
import { Injectable } from "@angular/core";

export interface Response {
  data: TimbradoDetalle;
}

@Injectable({
  providedIn: 'root',
})

export class SaveTimbradoDetalleGQL extends Mutation<Response> {
  document = saveTimbradoDetalleQuery;
}