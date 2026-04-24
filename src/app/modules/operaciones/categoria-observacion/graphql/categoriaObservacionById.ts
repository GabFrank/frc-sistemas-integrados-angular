import { Query } from "apollo-angular";
import { categoriaObservacionQuery } from "./graphql-query";
import { CategoriaObservacion } from "../categoria-observacion.model";
import { Injectable } from "@angular/core";

export interface Response {
  categoriaObservacion: CategoriaObservacion;
}

@Injectable({
  providedIn: 'root',
})
export class CategoriaObservacionByIdGQL extends Query<Response> {
  document = categoriaObservacionQuery;
}