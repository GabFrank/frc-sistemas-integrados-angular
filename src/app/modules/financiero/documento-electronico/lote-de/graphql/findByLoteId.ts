import { Query } from "apollo-angular";
import { loteDeQuery } from "./graphql-query";
import { LoteDE } from "../lote-de.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: LoteDE;
}

@Injectable({
  providedIn: 'root',
})
export class FindByLoteIdGQL extends Query<Response> {
  document = loteDeQuery;
}