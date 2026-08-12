import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { retirosDevolucionQuery } from "./graphql-query";

@Injectable({ providedIn: "root" })
export class GetRetirosDevolucionGQL extends Query<{ data: any }> {
  document = retirosDevolucionQuery;
}
