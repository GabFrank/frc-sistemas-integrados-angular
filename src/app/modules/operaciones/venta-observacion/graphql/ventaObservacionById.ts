import { Query } from "apollo-angular";
import { ventaObservacionQuery } from "./graphql-query";
import { VentaObservacion } from "../venta-observacion.model";
import { Injectable } from "@angular/core";

export interface Response {
  ventaObservacion: VentaObservacion;
}

@Injectable({
  providedIn: 'root',
})
export class VentaObservacionByIdGQL extends Query<Response> {
  document = ventaObservacionQuery;
}