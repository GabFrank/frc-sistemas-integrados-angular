import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { deleteProveedorServicioQuery } from "./graphql-query";

export interface Response {
  deleteProveedorServicio: boolean;
}

@Injectable({
  providedIn: "root",
})
export class DeleteProveedorServicioGQL extends Mutation<Response> {
  document = deleteProveedorServicioQuery;
}
