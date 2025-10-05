import { Query } from "apollo-angular";
import { puntoDeVentaQuery } from "./graphql-query";
import { PuntoDeVenta } from "../punto-de-venta.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: PuntoDeVenta;
}

@Injectable({
  providedIn: 'root',
})
export class PuntoDeVentaByIdGQL extends Query<Response> {
  document = puntoDeVentaQuery;
}