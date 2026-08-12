import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { colectasDevolucionQuery } from "./graphql-query";

@Injectable({ providedIn: "root" })
export class GetColectasDevolucionGQL extends Query<{ data: any }> {
  document = colectasDevolucionQuery;
}
