import { Injectable } from "@angular/core";
import { CajaObservacion } from "../caja-observacion.model";
import { Mutation } from "apollo-angular";
import { saveCajaObservacionQuery } from "./graphql-query";

export interface Response {
  data: CajaObservacion;
}

@Injectable({
  providedIn: 'root',
})
export class SaveCajaObservacionGQL extends Mutation<Response> {
  document = saveCajaObservacionQuery;
}