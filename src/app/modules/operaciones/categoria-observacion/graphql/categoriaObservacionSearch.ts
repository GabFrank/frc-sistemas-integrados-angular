import { Query } from "apollo-angular";
import { categoriaObservacionSearch } from "./graphql-query";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class CategoriaObservacionSearchGQL extends Query<Response> {
  document = categoriaObservacionSearch;
}