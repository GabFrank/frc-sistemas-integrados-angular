import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { Devolucion } from "../devolucion.model";
import { devolucionesPendientesPorProveedorQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class GetDevolucionesPendientesPorProveedorGQL extends Query<Devolucion[]> {
  document = devolucionesPendientesPorProveedorQuery;
}
