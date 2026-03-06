import { Query } from "apollo-angular";
import { puntoDeVentaPorIdQuery } from "./graphql-query";
import { PuntoDeVenta } from "../punto-de-venta.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: PuntoDeVenta;
}

@Injectable({
  providedIn: 'root',
})
export class PuntoDeVentaPorIdGQL extends Query<Response> {
  document = puntoDeVentaPorIdQuery;
}
