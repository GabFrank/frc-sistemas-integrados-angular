import { Query } from "apollo-angular";
import { loteDesQuery } from "./graphql-query";
import { Injectable } from "@angular/core";
import { LoteDE } from "../lote-de.model";

export interface Response {
  data: {
    getTotalPages: number;
    getTotalElements: number;
    getNumberOfElements: number;
    isFirst: boolean;
    isLast: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
    getContent: LoteDE[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class OnGetAllLotesGQL extends Query<Response> {
  document = loteDesQuery;
}
