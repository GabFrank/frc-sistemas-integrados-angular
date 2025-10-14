import { Query } from "apollo-angular";
import { loteDesPorFechaProcesadoBetweenQuery } from "./graphql-query";
import { LoteDE } from "../lote-de.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: LoteDE[];
}

@Injectable({
  providedIn: 'root',
})
export class LotesDePorFechaProcesadoGQL extends Query<Response> {
  document = loteDesPorFechaProcesadoBetweenQuery;
}