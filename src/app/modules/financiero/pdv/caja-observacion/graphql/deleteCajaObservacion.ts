import { Injectable } from "@angular/core";
import { CajaObservacion } from "../caja-observacion.model";
import { Mutation } from "apollo-angular";
import { deleteCajaObservacionQuery } from "./graphql-query";

export interface Response {
  data: CajaObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class DeleteCajaObservacionGQL extends Mutation<Response> {
  document = deleteCajaObservacionQuery;
}