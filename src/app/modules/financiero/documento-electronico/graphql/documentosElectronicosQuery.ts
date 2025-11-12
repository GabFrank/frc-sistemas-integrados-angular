import { Query } from "apollo-angular";
import { documentosElectronicosQuery } from "./graphql-query";
import { DocumentoElectronico } from "../documento-electronico.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: DocumentoElectronico[];
}

@Injectable({
  providedIn: 'root',
})
export class DocumentosElectronicosGQL extends Query<Response>{
  document = documentosElectronicosQuery;
}