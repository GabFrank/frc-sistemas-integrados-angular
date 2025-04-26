import { Query } from "apollo-angular";
import { ventaObservacionesQuery } from "./graphql-query";
import { VentaObservacion } from "../venta-observacion.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: VentaObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class AllVentaObservacionesGQL extends Query<Response> {
  document = ventaObservacionesQuery;
}