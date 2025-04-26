import { Mutation } from "apollo-angular";
import { deleteMotivoObservacionQuery } from "./graphql-query";
import { MotivoObservacion } from "../motivo-observacion.model";
import { Injectable } from "@angular/core";
export interface Reponse {
  data: MotivoObservacion[];
}
@Injectable({
  providedIn: 'root',
})
export class DeleteMotivoObservacionGQL extends Mutation<Response> {
  document = deleteMotivoObservacionQuery;
}