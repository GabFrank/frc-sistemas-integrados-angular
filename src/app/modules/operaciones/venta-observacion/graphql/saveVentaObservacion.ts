import { Mutation } from "apollo-angular";
import { saveVentaObservacionQuery } from "./graphql-query";
import { VentaObservacion } from "../venta-observacion.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: VentaObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class SaveVentaObservacionGQL extends Mutation<Response> {
  document = saveVentaObservacionQuery
}