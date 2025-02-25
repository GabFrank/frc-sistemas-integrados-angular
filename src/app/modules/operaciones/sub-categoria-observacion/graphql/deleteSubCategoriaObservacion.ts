import { Mutation } from "apollo-angular";
import { deleteSubCategoriaObservacion } from "./graphql-query";
import { SubCategoriaObservacion } from "../sub-categoria-observacion.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: SubCategoriaObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class DeleteSubCategoriaObservacionGQL extends Mutation<Response> {
  document = deleteSubCategoriaObservacion;
}