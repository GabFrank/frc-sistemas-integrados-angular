import { Mutation } from "apollo-angular";
import { saveSubCategoriaObservacion } from "./graphql-query";
import { SubCategoriaObservacion } from "../sub-categoria-observacion.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: SubCategoriaObservacion;
}

@Injectable({
  providedIn: 'root',
}
)
export class SaveSubCategoriaObservacionGQL extends Mutation<Response> {
  document = saveSubCategoriaObservacion;
}