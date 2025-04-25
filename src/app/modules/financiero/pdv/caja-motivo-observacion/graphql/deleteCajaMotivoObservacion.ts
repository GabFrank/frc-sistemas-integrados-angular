import { Injectable } from "@angular/core";
import { CajaMotivoObservacion } from "../caja-motivo-observacion.model";
import { Mutation } from "apollo-angular";
import { deleteCajaMotivoObservacionQuery } from "./graphql-query";

export interface Response {
  data: CajaMotivoObservacion[];
}
@Injectable({
  providedIn: 'root',
})
export class DeleteCajaMotivoObservacionGQL extends Mutation<Response> {
  document = deleteCajaMotivoObservacionQuery;
}