import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { remitoRetiroProveedorQuery } from "./graphql-query";

interface Response {
  data: string;
}

@Injectable({
  providedIn: "root",
})
export class RemitoRetiroProveedorGQL extends Query<Response> {
  document = remitoRetiroProveedorQuery;
}
