import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { ProductoRechazadoPage } from "../producto-rechazado.model";
import { productosRechazadosQuery } from "./graphql-query";

export interface ProductosRechazadosResponse {
  data: ProductoRechazadoPage;
}

@Injectable({
  providedIn: "root",
})
export class ProductosRechazadosGQL extends Query<ProductosRechazadosResponse> {
  override document = productosRechazadosQuery;
}
