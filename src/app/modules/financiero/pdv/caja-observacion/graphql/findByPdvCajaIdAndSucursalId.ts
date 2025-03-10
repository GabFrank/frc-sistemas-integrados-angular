import { Query } from "apollo-angular";
import { findByPdvCajaIdAndSucursalIdQuery } from "./graphql-query";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class FindByPdvCajaIdAndSucursalIdGQL extends Query<Response> {
  document = findByPdvCajaIdAndSucursalIdQuery;
}