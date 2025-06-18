import { Injectable } from "@angular/core";
import { Query, gql } from "apollo-angular";
import { PromocionPorSucursal } from "../promocion-por-sucursal";
import { getPromocionesPorPrecioIdQuery } from "./graphql-query";

export interface Response {
  promocionesPorPrecioId: PromocionPorSucursal[];
}

@Injectable({
  providedIn: "root",
})
export class getPromocionesPorPrecioIdGQL extends Query<Response> {
  document = getPromocionesPorPrecioIdQuery
} 