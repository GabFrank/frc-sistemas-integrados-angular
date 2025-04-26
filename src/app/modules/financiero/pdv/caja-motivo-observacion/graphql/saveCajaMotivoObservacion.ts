import { Injectable } from "@angular/core";
import { CajaMotivoObservacion } from "../caja-motivo-observacion.model";
import { Mutation } from "apollo-angular";
import { saveCajaMotivoObservacionQuery } from "./graphql-query";

export interface Response {
  data: CajaMotivoObservacion;
}

@Injectable({
  providedIn: 'root',
})
export class SaveCajaMotivoObservacionGQL extends Mutation<Response> {
  document = saveCajaMotivoObservacionQuery;
}