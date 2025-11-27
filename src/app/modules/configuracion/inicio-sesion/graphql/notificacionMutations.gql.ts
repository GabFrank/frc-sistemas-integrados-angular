import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { marcarNotificacionLeidaMutation, registrarInteraccionNotificacionMutation, actualizarEstadoTableroNotificacionMutation } from "./graphql-query";

export interface MarcarNotificacionLeidaResponse {
  data: boolean;
}

@Injectable({
  providedIn: "root",
})
export class MarcarNotificacionLeidaGQL extends Mutation<MarcarNotificacionLeidaResponse> {
  override document = marcarNotificacionLeidaMutation;
}

export interface RegistrarInteraccionNotificacionResponse {
  data: boolean;
}

@Injectable({
  providedIn: "root",
})
export class RegistrarInteraccionNotificacionGQL extends Mutation<RegistrarInteraccionNotificacionResponse> {
  override document = registrarInteraccionNotificacionMutation;
}

export interface ActualizarEstadoTableroNotificacionResponse {
  data: boolean;
}

@Injectable({
  providedIn: "root",
})
export class ActualizarEstadoTableroNotificacionGQL extends Mutation<ActualizarEstadoTableroNotificacionResponse> {
  override document = actualizarEstadoTableroNotificacionMutation;
}
