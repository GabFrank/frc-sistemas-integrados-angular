import { Injectable } from "@angular/core";
import { CajaSubCategoriaObservacion } from "../caja-subcategoria-observacion.model";
import { Query } from "apollo-angular";
import { cajaSubCategoriaObservacionQuery } from "./graphql-query";

export interface Response {
  cajaSubCategoriaObservacion: CajaSubCategoriaObservacion;
}

@Injectable({
  providedIn: 'root',
})
export class CajaSubCategoriaObsByIdGQL extends Query<Response> {
  document = cajaSubCategoriaObservacionQuery;
}