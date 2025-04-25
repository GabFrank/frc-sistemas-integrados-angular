import { Injectable } from "@angular/core";
import { CajaCategoriaObservacion } from "../caja-categoria-observacion.model";
import { Query } from "apollo-angular";
import { cajaCategoriaObservacionQuery } from "./graphql-query";

export interface Response {
  cajaCategoriaObservacion: CajaCategoriaObservacion;
}

@Injectable({
  providedIn: 'root',
})
export class CajaCategoriaObservacionByIdGQL extends Query<Response> {
  document = cajaCategoriaObservacionQuery;
}