import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { GET_GRUPOS_CREADOS } from "./graphql-query";
import { NotaRecepcionAgrupadaInfo } from "../solicitud-pago.component";

export interface GetGruposCreadosResponse {
  data: NotaRecepcionAgrupadaInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class GetGruposCreadosGQL extends Query<GetGruposCreadosResponse> {
  document = GET_GRUPOS_CREADOS;
} 