import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { ASIGNAR_NOTAS_A_GRUPO_EXISTENTE, GrupoOperacionResult } from "./graphql-query";

export interface AsignarNotasAGrupoResponse {
  data: GrupoOperacionResult;
}

@Injectable({
  providedIn: 'root'
})
export class AsignarNotasAGrupoGQL extends Mutation<AsignarNotasAGrupoResponse> {
  document = ASIGNAR_NOTAS_A_GRUPO_EXISTENTE;
} 