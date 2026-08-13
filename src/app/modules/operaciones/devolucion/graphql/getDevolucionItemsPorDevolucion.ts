import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { DevolucionItem } from "../devolucion.model";
import { devolucionItemsPorDevolucionQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class GetDevolucionItemsPorDevolucionGQL extends Query<DevolucionItem[]> {
  document = devolucionItemsPorDevolucionQuery;
}
