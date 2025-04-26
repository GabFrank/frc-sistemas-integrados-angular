import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { deleteCajaSubCategoriaObservacionQuery } from "./graphql-query";
import { CajaSubCategoriaObservacion } from "../caja-subcategoria-observacion.model";

export interface Response {
  data: CajaSubCategoriaObservacion[];
}
@Injectable({
  providedIn: 'root',
})
export class DeleteCajaSubCategoriaObsGQL extends Mutation<Response> {
  document = deleteCajaSubCategoriaObservacionQuery;
}