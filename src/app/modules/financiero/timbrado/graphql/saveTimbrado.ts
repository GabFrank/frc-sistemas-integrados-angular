import { Mutation } from "apollo-angular";
import { saveTimbradoQuery } from "./graphql-query";
import { Timbrado } from "../timbrado.modal";
import { Injectable } from "@angular/core";

export interface Response {
  data: Timbrado;
}

@Injectable({
  providedIn: 'root',
})

export class SaveTimbradoGQL extends Mutation<Response> {
  document = saveTimbradoQuery;
}