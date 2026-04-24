import { Mutation } from "apollo-angular";
import { saveMotivoObservacionQuery } from "./graphql-query";
import { MotivoObservacion } from "../motivo-observacion.model";
import { Injectable } from "@angular/core";
export interface Response {
  data: MotivoObservacion;
}

@Injectable({
  providedIn: 'root',
})
export class SaveMotivoObservacionGQL extends Mutation<Response> {
  document = saveMotivoObservacionQuery;
}