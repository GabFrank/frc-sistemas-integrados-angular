import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { remitoRetiroQuery } from "./graphql-query";

@Injectable({ providedIn: "root" })
export class GetRemitoRetiroGQL extends Query<{ data: string }> {
  document = remitoRetiroQuery;
}
