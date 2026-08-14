import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { reporteProductosVencidosQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class ReporteProductosVencidosGQL extends Query<String> {
  override document = reporteProductosVencidosQuery;
}
