import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { devolucionItemsPorDevolucionPageQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class GetDevolucionItemsPorDevolucionPageGQL extends Query<any> {
  document = devolucionItemsPorDevolucionPageQuery;
}
