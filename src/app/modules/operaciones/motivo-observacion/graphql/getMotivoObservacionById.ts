import { Query } from "apollo-angular";
import { motivoObservacionQuery } from "./graphql-query";
import { MotivoObservacion } from "../motivo-observacion.model";
import { Injectable } from "@angular/core";

export interface Response {
  motivoObservacion: MotivoObservacion;
}

@Injectable({
  providedIn: 'root',
})
export class GetMotivoObservacionByIdGQL extends Query<Response>{
  document = motivoObservacionQuery;
}