import { Mutation } from "apollo-angular";
import { saveCategoriaObservacion } from "./graphql-query";
import { CategoriaObservacion } from "../categoria-observacion.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: CategoriaObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class SaveCategoriaObservacionGQL extends Mutation<Response>{
  document = saveCategoriaObservacion;
}