import { Injectable } from "@angular/core";
import { Query, gql } from "apollo-angular";
import { verificarPromocionesQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class verificarPromocionesGQL extends Query<any> {
  document = verificarPromocionesQuery;
} 