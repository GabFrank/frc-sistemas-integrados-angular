import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { ProveedorServicio } from "../proveedor-servicio.model";
import { proveedorServicioQuery } from "./graphql-query";

export interface Response {
  data: ProveedorServicio;
}

@Injectable({
  providedIn: "root",
})
export class ProveedorServicioByIdGQL extends Query<Response> {
  document = proveedorServicioQuery;
}
