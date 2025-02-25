import { Query } from "apollo-angular";
import { categoriasObservacionesQuery } from "./graphql-query";
import { Injectable } from "@angular/core";
import { CategoriaObservacion } from "../categoria-observacion.model";

export interface Response {
  data: CategoriaObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class AllCategoriasObservacionesGQL extends Query<Response> {
  document = categoriasObservacionesQuery;
}