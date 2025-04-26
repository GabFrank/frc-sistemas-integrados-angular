import { Mutation } from "apollo-angular";
import { deleteVentaObservacionQuery } from "./graphql-query";
import { VentaObservacion } from "../venta-observacion.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: VentaObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class DeleteVentaObservacionGQL extends Mutation<Response> {
  document = deleteVentaObservacionQuery;
}