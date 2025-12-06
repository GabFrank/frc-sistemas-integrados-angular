import { Injectable } from "@angular/core";
import { Query, Mutation } from "apollo-angular";
import { 
  getComentariosNotificacionQuery, 
  getConteoComentariosNotificacionQuery,
  crearComentarioNotificacionMutation 
} from "./graphql-query";

export interface UsuarioComentario {
  id: number;
  nickname: string;
  persona?: {
    id: number;
    nombre: string;
  };
}

export interface ComentarioPadre {
  id: number;
  usuario: {
    id: number;
    nickname: string;
  };
}

export interface NotificacionComentario {
  id: number;
  comentario: string;
  creadoEn: string;
  actualizadoEn?: string;
  usuario: UsuarioComentario;
  comentarioPadre?: ComentarioPadre;
}

export interface GetComentariosNotificacionResponse {
  data: NotificacionComentario[];
}

export interface GetConteoComentariosNotificacionResponse {
  data: number;
}

export interface CrearComentarioNotificacionResponse {
  data: NotificacionComentario;
}

@Injectable({
  providedIn: "root",
})
export class GetComentariosNotificacionGQL extends Query<GetComentariosNotificacionResponse> {
  override document = getComentariosNotificacionQuery;
}

@Injectable({
  providedIn: "root",
})
export class GetConteoComentariosNotificacionGQL extends Query<GetConteoComentariosNotificacionResponse> {
  override document = getConteoComentariosNotificacionQuery;
}

@Injectable({
  providedIn: "root",
})
export class CrearComentarioNotificacionGQL extends Mutation<CrearComentarioNotificacionResponse> {
  override document = crearComentarioNotificacionMutation;
}

