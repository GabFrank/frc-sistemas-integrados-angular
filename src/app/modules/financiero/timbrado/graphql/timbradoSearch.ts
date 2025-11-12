import { Injectable } from "@angular/core";
import { Timbrado } from "../timbrado.modal";
import { timbradosSearchQuery } from "./graphql-query";
import { Query } from "apollo-angular";

export interface Response {
  data: Timbrado[];
}

@Injectable({
  providedIn: 'root',
})

export class TimbradoSearchGQL extends Query<Response>{
  document = timbradosSearchQuery;
}