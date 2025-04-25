import { Query } from "apollo-angular";
import { subCategoriaObservacionQuery } from "./graphql-query";
import { SubCategoriaObservacion } from "../sub-categoria-observacion.model";
import { Injectable } from "@angular/core";

export interface Response {
  subCategoriaObservacion: SubCategoriaObservacion;
}

@Injectable({
  providedIn: 'root',
})
export class SubCategoriaObservacionByIdGQL extends Query<Response> {
  document = subCategoriaObservacionQuery;
}