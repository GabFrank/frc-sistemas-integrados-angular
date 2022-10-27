import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { solicitarResourcesQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class SolicitarResourcesGQL extends Query<Boolean> {
  document = solicitarResourcesQuery;
}
