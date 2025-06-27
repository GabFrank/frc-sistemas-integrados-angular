import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { GET_GRUPOS_DISPONIBLES } from "./graphql-query";
import { NotaRecepcionAgrupada } from "../../../nota-recepcion/nota-recepcion-agrupada/nota-recepcion-agrupada.model";

export interface NotaRecepcionAgrupadaPage {
  getTotalPages: number;
  getTotalElements: number;
  getNumberOfElements: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  getContent: NotaRecepcionAgrupada[];
}

export interface GetGruposDisponiblesResponse {
  data: NotaRecepcionAgrupadaPage;
}

@Injectable({
  providedIn: 'root'
})
export class GetGruposDisponiblesGQL extends Query<GetGruposDisponiblesResponse> {
  document = GET_GRUPOS_DISPONIBLES;
} 