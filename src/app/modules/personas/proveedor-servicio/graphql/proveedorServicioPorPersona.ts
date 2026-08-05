import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { ProveedorServicio } from "../proveedor-servicio.model";
import { proveedorServicioPorPersona } from "./graphql-query";

export interface Response {
  data: ProveedorServicio;
}

@Injectable({
  providedIn: "root",
})
export class ProveedorServicioPorPersonaGQL extends Query<Response> {
  document = proveedorServicioPorPersona;
}
