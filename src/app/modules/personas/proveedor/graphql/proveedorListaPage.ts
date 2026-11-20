import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { Proveedor } from "../proveedor.model";
import { proveedorListaPage } from "./graphql-query";
import { PageInfo } from "../../../../app.component";

export interface Response {
  data: PageInfo<Proveedor>;
}

/** Lista de proveedores con filtro de estado (los buscadores usan ProveedoresSearchByPersonaPageGQL: solo activos). */
@Injectable({
  providedIn: "root",
})
export class ProveedorListaPageGQL extends Query<Response> {
  document = proveedorListaPage;
}
