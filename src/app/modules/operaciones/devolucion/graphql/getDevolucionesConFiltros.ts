import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { devolucionConFiltrosQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class GetDevolucionesConFiltrosGQL extends Query<any> {
  document = devolucionConFiltrosQuery;
}
