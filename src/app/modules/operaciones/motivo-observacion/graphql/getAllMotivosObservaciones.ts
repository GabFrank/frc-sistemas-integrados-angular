import { Query } from "apollo-angular";
import { motivosObservacionesQuery } from "./graphql-query";
import { MotivoObservacion } from "../motivo-observacion.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: MotivoObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class GetAllMotivosObservacionesGQL extends Query<Response> {
  document = motivosObservacionesQuery;
}