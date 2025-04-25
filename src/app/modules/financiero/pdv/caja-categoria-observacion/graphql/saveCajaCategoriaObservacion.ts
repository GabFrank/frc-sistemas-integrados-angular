import { Injectable } from "@angular/core";
import { CajaCategoriaObservacion } from "../caja-categoria-observacion.model";
import { Mutation } from "apollo-angular";
import { saveCajaCategoriaObservacion } from "./graphql-query";

export interface Response {
  data: CajaCategoriaObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class SaveCajaCategoriaObservacionGQL extends Mutation<Response> {
  document = saveCajaCategoriaObservacion;
}