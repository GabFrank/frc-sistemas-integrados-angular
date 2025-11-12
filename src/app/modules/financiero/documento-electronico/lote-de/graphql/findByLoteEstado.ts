import { Query } from "apollo-angular";
import { loteDesPorEstadoQuery } from "./graphql-query";
import { LoteDE } from "../lote-de.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: LoteDE[];
}

@Injectable({
  providedIn: 'root',
})
export class FindByLoteEstadoGQL extends Query<Response> {
  document = loteDesPorEstadoQuery;
}