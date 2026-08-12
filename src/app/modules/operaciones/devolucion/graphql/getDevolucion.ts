import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { Devolucion } from "../devolucion.model";
import { devolucionQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class GetDevolucionGQL extends Query<Devolucion> {
  document = devolucionQuery;
}
