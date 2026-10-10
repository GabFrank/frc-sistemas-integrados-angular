import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { ControlStockNegativoPage } from "../control-stock-negativo.model";
import { controlStockNegativoQuery } from "./graphql-query";

export interface ControlStockNegativoResponse {
  data: ControlStockNegativoPage;
}

@Injectable({
  providedIn: "root",
})
export class ControlStockNegativoGQL extends Query<ControlStockNegativoResponse> {
  override document = controlStockNegativoQuery;
}
