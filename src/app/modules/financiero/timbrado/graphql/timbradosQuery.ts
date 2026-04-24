import { Query } from "apollo-angular";
import { Timbrado } from "../timbrado.modal";
import { timbradosQuery } from "./graphql-query";
import { Injectable } from "@angular/core";

export interface Response {
  data: Timbrado[];
}

@Injectable({
  providedIn: 'root',
})

export class TimbradosGQL extends Query<Response> {
  document = timbradosQuery;
}