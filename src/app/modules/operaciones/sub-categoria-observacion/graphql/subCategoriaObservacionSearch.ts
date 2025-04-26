import { Query } from "apollo-angular";
import { subCategoriaObservacionSearch } from "./graphql-query";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class subCategoriaObservacionSearchGQL extends Query<Response> {
  document = subCategoriaObservacionSearch;
}