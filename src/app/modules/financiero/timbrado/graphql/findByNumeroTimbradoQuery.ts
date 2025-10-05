import { Query } from "apollo-angular";
import { findByNumeroQuery } from "./graphql-query";
import { Timbrado } from "../timbrado.modal";
import { Injectable } from "@angular/core";

export interface Response {
  data: Timbrado;
}

@Injectable({
  providedIn: 'root',
})

export class FindByNumeroTimbradoGQL extends Query<Response> {
  document = findByNumeroQuery;
}