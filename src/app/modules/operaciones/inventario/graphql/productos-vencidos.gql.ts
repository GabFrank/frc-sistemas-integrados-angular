import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { productosVencidosQuery } from "./graphql-query";
import { InventarioProductoItem } from "../inventario.model";

export interface ProductosVencidosPage {
  getTotalPages: number;
  getTotalElements: number;
  getNumberOfElements: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  getPageable: {
    getPageNumber: number;
    getPageSize: number;
  };
  getContent: InventarioProductoItem[];
}

export interface ProductosVencidosResponse {
  productosVencidos: ProductosVencidosPage;
}

@Injectable({
  providedIn: "root",
})
export class ProductosVencidosGQL extends Query<ProductosVencidosResponse> {
  override document = productosVencidosQuery;
}