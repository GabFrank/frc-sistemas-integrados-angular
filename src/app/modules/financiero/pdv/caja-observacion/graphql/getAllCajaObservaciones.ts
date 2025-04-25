import { Injectable } from "@angular/core";
import { CajaObservacion } from "../caja-observacion.model";
import { Query } from "apollo-angular";
import { cajaObservacionesQuery } from "./graphql-query";

export interface Response {
  data: CajaObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class GetAllCajaObservacionesGQL extends Query<Response> {
  document = cajaObservacionesQuery;
}

