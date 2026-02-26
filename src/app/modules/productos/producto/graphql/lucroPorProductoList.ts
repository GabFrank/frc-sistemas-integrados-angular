import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { lucroPorProductoListQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class LucroPorProductoListGQL extends Query<any> {
  document = lucroPorProductoListQuery;
}
