import { Injectable } from "@angular/core";
import { CajaSubCategoriaObservacion } from "../caja-subcategoria-observacion.model"
import { Query } from "apollo-angular";
import { cajaSubCategoriasObservacionesQuery } from "./graphql-query";

export interface Response {
  data: CajaSubCategoriaObservacion[];
}
@Injectable({
  providedIn: 'root',
})
export class getAllCajaSubCategoriaObsGQL extends Query<Response> {
  document = cajaSubCategoriasObservacionesQuery;
}