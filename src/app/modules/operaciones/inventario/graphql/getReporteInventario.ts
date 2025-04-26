import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { reporteInventarioQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class reporteInventarioGQL extends Query<String> {
  document = reporteInventarioQuery;
}
