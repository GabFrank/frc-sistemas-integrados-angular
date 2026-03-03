import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import {
  marcarNotificacionLeidaMutation,
  marcarTodasNotificacionesLeidasMutation,

  cambiarEstadoTableroNotificacionMutation,
  actualizarTokenFcmMutation
} from "./graphql-query";

export interface MarcarNotificacionLeidaResponse {
  data: boolean;
}

@Injectable({
  providedIn: "root",
})
export class MarcarNotificacionLeidaGQL extends Mutation<MarcarNotificacionLeidaResponse> {
  override document = marcarNotificacionLeidaMutation;
}

export interface MarcarTodasNotificacionesLeidasResponse {
  data: boolean;
}

@Injectable({
  providedIn: "root",
})
export class MarcarTodasNotificacionesLeidasGQL extends Mutation<MarcarTodasNotificacionesLeidasResponse> {
  override document = marcarTodasNotificacionesLeidasMutation;
}

@Injectable({
  providedIn: "root",
})
export class CambiarEstadoTableroNotificacionGQL extends Mutation {
  override document = cambiarEstadoTableroNotificacionMutation;
}

@Injectable({
  providedIn: "root",
})
export class ActualizarTokenFcmGQL extends Mutation {
  override document = actualizarTokenFcmMutation;
}

