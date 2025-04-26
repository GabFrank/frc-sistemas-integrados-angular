import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { imprimirCodigoBarraQuery } from "./graphql-query";

interface Response {
  data: string;
}

@Injectable({
  providedIn: "root",
})
export class ImprimirCodigoBarraGQL extends Query<Response> {
  document = imprimirCodigoBarraQuery;
}
