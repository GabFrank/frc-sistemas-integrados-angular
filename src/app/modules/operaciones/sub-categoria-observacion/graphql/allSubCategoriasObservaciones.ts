import { Query } from "apollo-angular";
import { subCategoriasObservacionesQuery } from "./graphql-query";
import { SubCategoriaObservacion } from "../sub-categoria-observacion.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: SubCategoriaObservacion[];
}

@Injectable({
  providedIn: 'root',
})
export class AllSubCategoriasObservacionesGQL extends Query<Response> {
  document = subCategoriasObservacionesQuery;
}