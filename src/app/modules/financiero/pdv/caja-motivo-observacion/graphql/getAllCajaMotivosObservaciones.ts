import { Injectable } from "@angular/core";
import { CajaMotivoObservacion } from "../caja-motivo-observacion.model";
import { Query } from "apollo-angular";
import { cajaMotivosObservacionesQuery } from "./graphql-query";

export interface Response {
  data: CajaMotivoObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class GetAllCajaMotivosObservacionesGQL extends Query<Response> {
  document = cajaMotivosObservacionesQuery;
}