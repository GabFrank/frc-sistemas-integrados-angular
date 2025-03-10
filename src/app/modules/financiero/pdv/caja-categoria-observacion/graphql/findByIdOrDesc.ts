import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { findByIdOrDescQuery } from "./graphql-query";

@Injectable({
  providedIn: 'root',
})
export class FindByIdOrDescGQL extends Query<Response> {
  document = findByIdOrDescQuery;
}