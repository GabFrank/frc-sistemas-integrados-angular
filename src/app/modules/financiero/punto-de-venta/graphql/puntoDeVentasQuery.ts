import { Query } from "apollo-angular";
import { puntoDeVentasQuery } from "./graphql-query";
import { PuntoDeVenta } from "../punto-de-venta.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: PuntoDeVenta[];
}

@Injectable({
  providedIn: 'root',
})
export class PuntoDeVentasGQL extends Query<Response> {
  document = puntoDeVentasQuery;
}