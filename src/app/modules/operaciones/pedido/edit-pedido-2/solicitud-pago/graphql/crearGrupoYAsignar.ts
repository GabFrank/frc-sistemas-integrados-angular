import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { CREAR_GRUPO_Y_ASIGNAR, GrupoOperacionResult } from "./graphql-query";

export interface CrearGrupoYAsignarResponse {
  data: GrupoOperacionResult;
}

@Injectable({
  providedIn: 'root'
})
export class CrearGrupoYAsignarGQL extends Mutation<CrearGrupoYAsignarResponse> {
  document = CREAR_GRUPO_Y_ASIGNAR;
} 