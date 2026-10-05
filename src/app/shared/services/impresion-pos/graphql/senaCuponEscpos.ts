import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { senaCuponEscposQuery } from "./graphql-query";

class Response {
  data: string;
}

@Injectable({
  providedIn: "root",
})
export class SenaCuponEscposGQL extends Query<Response> {
  document = senaCuponEscposQuery;
}
