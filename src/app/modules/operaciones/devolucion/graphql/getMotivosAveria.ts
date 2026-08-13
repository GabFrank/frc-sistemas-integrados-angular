import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { MotivoAveria } from "../devolucion.model";
import { motivosAveriaActivosQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class GetMotivosAveriaGQL extends Query<MotivoAveria[]> {
  document = motivosAveriaActivosQuery;
}
