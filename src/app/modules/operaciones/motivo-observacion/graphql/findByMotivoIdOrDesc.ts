import { Query } from "apollo-angular";
import { findByMotivoIdOrDescQuery } from "./graphql-query";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class FindByMotivoIdOrDescGQL extends Query<Response> {
  document = findByMotivoIdOrDescQuery;
}