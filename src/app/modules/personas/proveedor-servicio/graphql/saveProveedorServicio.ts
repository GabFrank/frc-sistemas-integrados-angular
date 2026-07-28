import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { ProveedorServicio } from "../proveedor-servicio.model";
import { saveProveedorServicio } from "./graphql-query";

export interface Response {
  data: ProveedorServicio;
}

@Injectable({
  providedIn: "root",
})
export class SaveProveedorServicioGQL extends Mutation<Response> {
  document = saveProveedorServicio;
}
