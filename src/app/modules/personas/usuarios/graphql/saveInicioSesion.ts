import { Injectable } from "@angular/core";
import { Mutation, Query } from "apollo-angular";
import { InicioSesion } from "../../../configuracion/models/inicio-sesion.model";
import { saveInicioSesionGQL } from "./graphql-query";

export interface Response {
  data: InicioSesion;
}

@Injectable({
  providedIn: "root"
})
export class SaveInicioSesionGQL extends Mutation<Response> {
  document = saveInicioSesionGQL;
}
