import { Injectable } from "@angular/core";
import { CajaCategoriaObservacion } from "../caja-categoria-observacion.model";
import { Query } from "apollo-angular";
import { cajasCategoriasObservacionesQuery } from "./graphql-query";

export interface Response {
  data: CajaCategoriaObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class AllCajaCategoriaObservacionesGQL extends Query<Response> {
  document = cajasCategoriasObservacionesQuery;
}