import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { PageInfo } from "../../../../app.component";
import { ProveedorServicio } from "../proveedor-servicio.model";
import { proveedorServicioSearchPage } from "./graphql-query";

export interface Response {
  data: PageInfo<ProveedorServicio>;
}

@Injectable({
  providedIn: "root",
})
export class ProveedorServicioSearchPageGQL extends Query<Response> {
  document = proveedorServicioSearchPage;
}
