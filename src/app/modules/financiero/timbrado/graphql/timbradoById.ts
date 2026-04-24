import { Query } from "apollo-angular";
import { timbradoQuery } from "./graphql-query";
import { Timbrado } from "../timbrado.modal";
import { Injectable } from "@angular/core";

export interface Response {
  data: Timbrado;
}

@Injectable({
  providedIn: 'root',
})

export class TimbradoByIdGQL extends Query<Response> {
  document = timbradoQuery;
}