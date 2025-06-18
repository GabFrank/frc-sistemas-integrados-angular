import { Injectable } from "@angular/core";
import { Mutation, gql } from "apollo-angular";
import { deleteBulkPromocionPorSucursalQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class deleteBulkPromocionPorSucursalGQL extends Mutation {
  document = deleteBulkPromocionPorSucursalQuery;
} 