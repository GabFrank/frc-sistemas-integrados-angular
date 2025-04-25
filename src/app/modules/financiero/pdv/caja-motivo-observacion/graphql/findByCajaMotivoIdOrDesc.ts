import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { findByCajaMotivoIdOrDescQuery } from "./graphql-query";

@Injectable({
  providedIn: 'root',
})
export class FindByCajaMotivoIdOrDescGQL extends Query<Response> {
  document = findByCajaMotivoIdOrDescQuery;
}