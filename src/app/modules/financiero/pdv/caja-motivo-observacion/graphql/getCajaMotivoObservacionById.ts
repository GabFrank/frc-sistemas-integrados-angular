import { Injectable } from "@angular/core";
import { CajaMotivoObservacion } from "../caja-motivo-observacion.model";
import { Query } from "apollo-angular";
import { cajaMotivoObservacionQuery } from "./graphql-query";

export interface Response {
  cajaMotivoObservacion: CajaMotivoObservacion;
}

@Injectable({
  providedIn: 'root',
})
export class GetCajaMotivoObservacionByIdGQL extends Query<Response> {
  document = cajaMotivoObservacionQuery;
}