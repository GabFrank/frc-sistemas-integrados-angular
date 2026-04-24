import { Query } from "apollo-angular";
import { ultimoCambioPorMonedaIdQuery } from "./graphql-query";
import { Cambio } from "../cambio.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: Cambio;
}

@Injectable({
  providedIn: 'root',
})
export class UltimoCambioPorMonedaIdGQL extends Query<Response> {
  document = ultimoCambioPorMonedaIdQuery;
}

