import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { findByVentaAndSucursalIdQuery } from "./graphql-query";

@Injectable({
  providedIn: 'root',
})
export class findByVentaIdAndSucursalIdGQL extends Query<Response> {
  document = findByVentaAndSucursalIdQuery;
}