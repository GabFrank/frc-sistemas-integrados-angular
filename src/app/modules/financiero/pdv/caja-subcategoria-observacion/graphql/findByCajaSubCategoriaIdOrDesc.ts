import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { findByCajaSubCategoriaIdOrDescQuery } from "./graphql-query";

@Injectable({
  providedIn: 'root',
})
export class CajaSubCategoriaObsSearchGQL extends Query<Response> {
  document = findByCajaSubCategoriaIdOrDescQuery;
}