import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { GET_NOTAS_SIN_AGRUPAR } from "./graphql-query";
import { NotaRecepcion } from "../../../nota-recepcion/nota-recepcion.model";

export interface GetNotasSinAgruparResponse {
  data: NotaRecepcion[];
}

@Injectable({
  providedIn: 'root'
})
export class GetNotasSinAgruparGQL extends Query<GetNotasSinAgruparResponse> {
  document = GET_NOTAS_SIN_AGRUPAR;
} 