import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { lucroPorFuncionarioListQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class LucroPorFuncionarioListGQL extends Query<any> {
  document = lucroPorFuncionarioListQuery;
}
