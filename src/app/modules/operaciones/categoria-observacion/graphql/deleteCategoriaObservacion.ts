import { Mutation } from "apollo-angular";
import { deleteCategoriaObservacionQuery } from "./graphql-query";
import { Injectable } from "@angular/core";
import { CategoriaObservacion } from "../categoria-observacion.model";

export interface Response {
  data: CategoriaObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class DeleteCategoriaObservacionGQL extends Mutation<Response> {
  document = deleteCategoriaObservacionQuery;
}